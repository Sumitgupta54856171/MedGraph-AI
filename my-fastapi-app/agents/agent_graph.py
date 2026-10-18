import os
import re
import time
from typing import List, Optional, TypedDict
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from falkordb import FalkorDB

load_dotenv()

AMD_API_KEY = os.getenv("AMD_API_KEY")
AMD_BASE_URL = os.getenv("AMD_BASE_URL", "https://notebooks.amd.com/tokenfactory/api/v1")

# =====================================================================
# 1. INITIALIZE AMD ROCm LLM & FALKORDB
# =====================================================================
gemma_clinical_llm = ChatOpenAI(
    model="Gemma-4-31B-IT",
    api_key=AMD_API_KEY,
    base_url=AMD_BASE_URL,
    temperature=0.1
)

db = FalkorDB(host='localhost', port=6379)
graph = db.select_graph("medgraph_hospital_brain")

# Ensure advanced multi-specialty clinical knowledge graph is seeded
graph.query("""
MERGE (d1:Doctor {name: 'Dr. Sarah Jenkins, MD', dept: 'Cardiology'})
MERGE (d2:Doctor {name: 'Dr. Rajeev Menon, MD', dept: 'Nephrology'})

MERGE (w:Medication {name: 'Warfarin', class: 'Anticoagulant'})
MERGE (a:Medication {name: 'Aspirin', class: 'Antiplatelet'})
MERGE (li:Medication {name: 'Lisinopril', class: 'ACE Inhibitor'})
MERGE (sp:Medication {name: 'Spironolactone', class: 'K-Sparing Diuretic'})
MERGE (ib:Medication {name: 'Ibuprofen', class: 'NSAID'})
MERGE (at:Medication {name: 'Atorvastatin', class: 'Statin'})

MERGE (alt1:Alternative {name: 'Acetaminophen (Paracetamol) or Low-Dose Aspirin 81mg + Pantoprazole 40mg', rationale: 'Bypasses COX-1 mucosal toxicity or shields gastric mucosa'})
MERGE (alt2:Alternative {name: 'Hold Ibuprofen & Monitor Serum Potassium (K+) + Creatinine in 24h', rationale: 'Prevents acute eGFR drop and hyperkalemic arrhythmia'})

MERGE (p1:BiologicalPathway {name: 'Dual Hemostatic Inhibition (VKORC1 + COX-1 Platelet Aggregation)'})
MERGE (r1:ClinicalRisk {name: 'Major Systemic & Intracranial Hemorrhage', severity: 'CRITICAL'})

MERGE (p2:BiologicalPathway {name: 'Efferent Arteriole Constriction + Distal Tubular K+ Retention'})
MERGE (r2:ClinicalRisk {name: 'Severe Hyperkalemia & Acute Kidney Injury (AKI)', severity: 'CRITICAL'})

MERGE (w)-[:INTERACTS_WITH]->(a)
MERGE (a)-[:TRIGGERS_PATHWAY]->(p1)-[:CAUSES_RISK]->(r1)
MERGE (r1)-[:RECOMMENDED_ALTERNATIVE]->(alt1)
MERGE (r1)-[:ESCALATE_TO]->(d1)

MERGE (li)-[:INTERACTS_WITH]->(ib)
MERGE (sp)-[:INTERACTS_WITH]->(ib)
MERGE (ib)-[:TRIGGERS_PATHWAY]->(p2)-[:CAUSES_RISK]->(r2)
MERGE (r2)-[:RECOMMENDED_ALTERNATIVE]->(alt2)
MERGE (r2)-[:ESCALATE_TO]->(d2)
""")


# =====================================================================
# 2. STATE DEFINITION
# =====================================================================
class MedGraphState(TypedDict):
    raw_clinical_notes: str
    target_language: str
    autonomous_floor: int
    patient_mrn: Optional[str]  # For Layer 2 extraction
    sanitized_notes: str
    extracted_entities: dict  # Layer 2: extracted conditions, medications, vitals
    graph_paths: List[dict]
    llm_analysis: Optional[str]
    requires_physician_lock: bool
    agent_trace: List[dict]


# =====================================================================
# 3. LANGGRAPH AGENT NODES
# =====================================================================

async def pii_guard_node(state: MedGraphState) -> dict:
    """Agent 1: PII Sanitization Node."""
    text = state["raw_clinical_notes"]
    masked = re.sub(r'\b(MRN|ID|SSN)[:#\s]*[A-Za-z0-9-]{4,15}\b', r'\1: [MASKED-ID]', text, flags=re.IGNORECASE)

    # Extract MRN if present for Layer 2
    mrn_match = re.search(r'\bMRN[:#\s]*(PT-\d{4,6})\b', text, flags=re.IGNORECASE)
    extracted_mrn = mrn_match.group(1) if mrn_match else None

    return {
        "sanitized_notes": masked,
        "patient_mrn": extracted_mrn,
        "agent_trace": state.get("agent_trace", []) + [{"agent": "PII_Guard", "status": "Clean"}]
    }


async def entity_extraction_node(state: MedGraphState) -> dict:
    """Layer 2: Live LLM Text-to-Graph Extraction Node."""
    t0 = time.perf_counter()

    # Use LLM to extract clinical entities
    extraction_prompt = f"""Extract clinical entities from these notes. Return as JSON with keys:
- conditions: list of condition names (e.g., "Atrial Fibrillation", "Hypertension")
- medications: list of medication names (e.g., "Warfarin", "Aspirin", "Lisinopril")
- vitals: list of vital signs mentioned (e.g., "BP 140/90", "HR 88")

Notes: {state['sanitized_notes']}

Return ONLY valid JSON, no other text."""

    try:
        response = await gemma_clinical_llm.ainvoke(extraction_prompt)
        import json
        # Clean up response to extract JSON
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        extracted = json.loads(content)
    except Exception as e:
        # Fallback: simple regex extraction
        extracted = {
            "conditions": [],
            "medications": [],
            "vitals": []
        }
        # Simple medication detection
        meds = ["Warfarin", "Aspirin", "Lisinopril", "Spironolactone", "Ibuprofen", "Atorvastatin", "Metformin", "Clopidogrel", "Digoxin", "Furosemide"]
        for med in meds:
            if med.lower() in state["sanitized_notes"].lower():
                extracted["medications"].append(med)

    # Write patient's live clinical graph to FalkorDB (Layer 2)
    mrn = state.get("patient_mrn", "UNKNOWN")
    enc_id = f"ENC-{int(time.time() * 1000)}"

    # Create patient node and link to conditions
    for cond in extracted.get("conditions", []):
        if cond and cond.strip():  # Skip empty/null conditions
            graph.query("""
            MERGE (p:Patient {mrn: COALESCE($mrn, 'UNKNOWN')})
            MERGE (c:Condition {name: COALESCE($cond, 'Unknown Condition')})
            MERGE (p)-[:DIAGNOSED_WITH {session: $enc_id, timestamp: timestamp()}]->(c)
            """, {"mrn": mrn, "cond": cond.strip(), "enc_id": enc_id})

    # Create patient node and link to medications
    for med in extracted.get("medications", []):
        if med and med.strip():  # Skip empty/null medications
            graph.query("""
            MERGE (p:Patient {mrn: COALESCE($mrn, 'UNKNOWN')})
            MERGE (m:Medication {name: COALESCE($med, 'Unknown Medication')})
            MERGE (p)-[:PRESCRIBED {session: $enc_id, timestamp: timestamp()}]->(m)
            """, {"mrn": mrn, "med": med.strip(), "enc_id": enc_id})

    latency = int((time.perf_counter() - t0) * 1000)
    return {
        "extracted_entities": extracted,
        "agent_trace": state.get("agent_trace", []) + [{
            "agent": "Entity_Extraction_Layer2",
            "latency_ms": latency,
            "entities_extracted": extracted
        }]
    }


async def graph_reasoning_node(state: MedGraphState) -> dict:
    """Layer 2: Advanced Multi-Hop Graph Traversal from Patient Node - DDI + Pathway + Safe Alternative + Specialist Escalation."""
    t0 = time.perf_counter()
    notes_lower = state["sanitized_notes"].lower()

    # Use extracted entities from Layer 2, or fallback to detection
    extracted_meds = state.get("extracted_entities", {}).get("medications", [])
    candidate_drugs = ["Warfarin", "Aspirin", "Lisinopril", "Spironolactone", "Ibuprofen", "Atorvastatin", "Metformin", "Clopidogrel", "Digoxin", "Furosemide"]

    if extracted_meds:
        detected_drugs = [m for m in extracted_meds if m in candidate_drugs]
    else:
        detected_drugs = [d for d in candidate_drugs if d.lower() in notes_lower]

    paths = []
    mrn = state.get("patient_mrn", "UNKNOWN")

    # Layer 2: Multi-hop traversal starting from Patient node
    if len(detected_drugs) >= 2:
        res = graph.query("""
        MATCH (p:Patient {mrn: $mrn})-[:PRESCRIBED]->(m1:Medication)-[:INTERACTS_WITH]->(m2:Medication)-[:TRIGGERS_PATHWAY]->(path:BiologicalPathway)-[:CAUSES_RISK]->(r:ClinicalRisk)
        WHERE m1.name IN $drugs AND m2.name IN $drugs
        OPTIONAL MATCH (r)-[:RECOMMENDED_ALTERNATIVE]->(alt:Alternative)
        OPTIONAL MATCH (r)-[:ESCALATE_TO]->(doc:Doctor)
        RETURN m1.name, m2.name, path.name, r.name, r.severity, alt.name, doc.name, doc.dept
        """, {"mrn": mrn, "drugs": detected_drugs})

        for row in res.result_set:
            d1, d2, pathway, risk, sev, alt, doc, dept = row
            # Handle null values safely
            safe_alt = alt if alt else "Not specified"
            safe_doc = doc if doc else "Dr. Sarah Jenkins, MD"
            safe_dept = dept if dept else "Cardiology"
            paths.append({
                "path": f"({d1} + {d2}) ➔ ({pathway}) ➔ ⚠️ [{risk} | {sev}] ➔ 💡 Safe Swap: [{safe_alt}] ➔ 👨‍⚕️ Escalate: {safe_doc} ({safe_dept})",
                "risk": risk,
                "severity": sev,
                "safe_alternative": safe_alt,
                "specialist": f"{safe_doc} ({safe_dept})"
            })

    if not paths:
        paths.append({
            "path": f"({', '.join(detected_drugs) if detected_drugs else 'Triage Vitals & History'}) ➔ FalkorDB Protocol Graph ➔ ✅ [No Contraindicated Drug Pairs Found]",
            "risk": "Low / Diagnostic Workup Only",
            "severity": "MODERATE",
            "safe_alternative": "Proceed with standard diagnostic protocol",
            "specialist": "Dr. Sarah Jenkins, MD (Cardiology)"
        })

    latency = int((time.perf_counter() - t0) * 1000)
    return {
        "graph_paths": paths,
        "agent_trace": state.get("agent_trace", []) + [{
            "agent": "FalkorDB_Graph_Traversal_Layer2",
            "latency_ms": latency,
            "drugs_evaluated": detected_drugs,
            "patient_mrn": mrn
        }]
    }


async def gemma_clinical_node(state: MedGraphState) -> dict:
    """Agent 3: Gemma-4-31B-IT Clinical Verification & Safety Gate Node."""
    t0 = time.perf_counter()

    graph_context = "\n".join([p["path"] for p in state.get("graph_paths", [])])
    has_critical_risk = any(p.get("severity") == "CRITICAL" for p in state.get("graph_paths", []))

    prompt = f"""You are the Clinical Safety Agent running on AMD ROCm (Gemma-4-31B-IT).
Here is the multi-hop graph reasoning path from FalkorDB regarding the patient's medications and safe alternatives:
{graph_context}

Analyze these clinical notes and provide a professional clinical risk assessment with clear headings, recommended safe alternatives, and safety warnings:
Notes: {state['sanitized_notes']}"""

    response = await gemma_clinical_llm.ainvoke(prompt)
    latency = int((time.perf_counter() - t0) * 1000)

    return {
        "llm_analysis": response.content,
        "requires_physician_lock": has_critical_risk,
        "agent_trace": state.get("agent_trace", []) + [{"agent": "Gemma_Clinical_Agent", "latency_ms": latency}]
    }


# =====================================================================
# 4. COMPILE GRAPH
# =====================================================================
workflow = StateGraph(MedGraphState)
workflow.add_node("pii_guard", pii_guard_node)
workflow.add_node("entity_extraction", entity_extraction_node)
workflow.add_node("graph_reasoning", graph_reasoning_node)
workflow.add_node("gemma_clinical", gemma_clinical_node)

workflow.add_edge(START, "pii_guard")
workflow.add_edge("pii_guard", "entity_extraction")
workflow.add_edge("entity_extraction", "graph_reasoning")
workflow.add_edge("graph_reasoning", "gemma_clinical")
workflow.add_edge("gemma_clinical", END)

medgraph_workflow = workflow.compile()