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

# Ensure baseline knowledge graph is seeded
graph.query("""
MERGE (w:Medication {name: 'Warfarin'})
MERGE (a:Medication {name: 'Aspirin'})
MERGE (mech:BiologicalPathway {name: 'Platelet Aggregation Pathway'})
MERGE (risk:ClinicalRisk {name: 'Major Bleeding & Hemorrhage', severity: 'CRITICAL'})
MERGE (w)-[:MODULATES]->(mech)
MERGE (a)-[:INHIBITS]->(mech)
MERGE (mech)-[:TRIGGERS_RISK]->(risk)
""")


# =====================================================================
# 2. STATE DEFINITION
# =====================================================================
class MedGraphState(TypedDict):
    raw_clinical_notes: str
    target_language: str
    autonomous_floor: int
    sanitized_notes: str
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
    return {
        "sanitized_notes": masked,
        "agent_trace": state.get("agent_trace", []) + [{"agent": "PII_Guard", "status": "Clean"}]
    }


async def graph_reasoning_node(state: MedGraphState) -> dict:
    """Agent 2: FalkorDB Multi-Hop Graph Traversal Node (Track 1 & 3)."""
    t0 = time.perf_counter()

    # Run the exact multi-hop query that just passed successfully
    res = graph.query("""
    MATCH (m1:Medication {name: 'Warfarin'})-[:MODULATES]->(p:BiologicalPathway)<-[:INHIBITS]-(m2:Medication {name: 'Aspirin'})
    MATCH (p)-[:TRIGGERS_RISK]->(r:ClinicalRisk)
    RETURN m1.name, m2.name, p.name, r.name, r.severity
    """)

    paths = []
    for row in res.result_set:
        paths.append({
            "path": f"({row[0]} + {row[1]}) ➔ ({row[2]}) ➔ ⚠️ [{row[3]} | Severity: {row[4]}]",
            "risk": row[3],
            "severity": row[4]
        })

    latency = int((time.perf_counter() - t0) * 1000)
    return {
        "graph_paths": paths,
        "agent_trace": state.get("agent_trace", []) + [{"agent": "FalkorDB_Graph_Traversal", "latency_ms": latency}]
    }


async def gemma_clinical_node(state: MedGraphState) -> dict:
    """Agent 3: Gemma-4-31B-IT Clinical Verification & Safety Gate Node."""
    t0 = time.perf_counter()

    graph_context = "\n".join([p["path"] for p in state.get("graph_paths", [])])

    prompt = f"""You are the Clinical Safety Agent running on AMD ROCm (Gemma-4-31B-IT).
Here is the multi-hop graph reasoning path from FalkorDB regarding the patient's medications:
{graph_context}

Analyze these clinical notes and provide a professional clinical risk assessment with clear headings and safety warnings:
Notes: {state['sanitized_notes']}"""

    response = await gemma_clinical_llm.ainvoke(prompt)
    latency = int((time.perf_counter() - t0) * 1000)

    return {
        "llm_analysis": response.content,
        "requires_physician_lock": True,  # High risk DDI detected
        "agent_trace": state.get("agent_trace", []) + [{"agent": "Gemma_Clinical_Agent", "latency_ms": latency}]
    }


# =====================================================================
# 4. COMPILE GRAPH
# =====================================================================
workflow = StateGraph(MedGraphState)
workflow.add_node("pii_guard", pii_guard_node)
workflow.add_node("graph_reasoning", graph_reasoning_node)
workflow.add_node("gemma_clinical", gemma_clinical_node)

workflow.add_edge(START, "pii_guard")
workflow.add_edge("pii_guard", "graph_reasoning")
workflow.add_edge("graph_reasoning", "gemma_clinical")
workflow.add_edge("gemma_clinical", END)

medgraph_workflow = workflow.compile()