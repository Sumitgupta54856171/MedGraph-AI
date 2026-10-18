import os
import time
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from agents.agent_graph import medgraph_workflow, graph
from routers import auth, encounters, doctor_admin
from database import engine, Base
from ingestion_agents import run_ontology_ingestion_pipeline

load_dotenv()

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MedGraph Clinical AI - AMD ROCm Backend",
    description="Dual-LLM Pipeline: Gemma-4-31B-IT (Clinical Safety Gate) + DeepSeek-V4.1-Flash (Patient GenUI)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(encounters.router)
app.include_router(doctor_admin.router)

AMD_API_KEY = os.getenv("AMD_API_KEY")
AMD_BASE_URL = os.getenv("AMD_BASE_URL")

class EncounterInput(BaseModel):
    clinical_notes: str = Field(..., min_length=5, description="Live doctor clinical notes")
    target_language: str = Field(default="English")
    autonomous_floor: int = Field(default=80)

class SignOffInput(BaseModel):
    doctor_name: str = Field(default="Dr. Sarah Jenkins, MD")
    encounter_id: str = Field(default="#ENC-9082-TX")
    action: str = Field(default="APPROVE")
    notes: Optional[str] = Field(default="Physician digitally reviewed contraindications and verified clinical safety.")

@app.get("/")
def main():
    return {"message": "MedGraph Clinical AI Backend Online"}

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "orchestrator": "LangGraph Stateful Multi-Agent Pipeline",
        "infrastructure": "AMD ROCm Cloud + FalkorDB Graph Database",
        "active_agents": [
            "1. pii_guard_node",
            "2. graph_reasoning_node (FalkorDB Multi-Hop 5-Hop Traversal)",
            "3. gemma_clinical_node (Gemma-4-31B-IT)",
            "4. audit_signoff_writeback_node (FalkorDB Closed-Loop)"
        ]
    }

@app.post("/api/analyze")
async def execute_analysis_api(req: EncounterInput):
    """Triggers the LangGraph pipeline from the frontend API call."""
    if not os.getenv("AMD_API_KEY"):
        raise HTTPException(status_code=500, detail="Missing AMD_API_KEY in backend .env")

    t_start = time.perf_counter()
    try:
        initial_state = {
            "raw_clinical_notes": req.clinical_notes,
            "target_language": req.target_language,
            "autonomous_floor": req.autonomous_floor,
            "patient_mrn": None,
            "sanitized_notes": "",
            "extracted_entities": {},
            "graph_paths": [],
            "llm_analysis": None,
            "requires_physician_lock": False,
            "agent_trace": []
        }

        # Run compiled LangGraph workflow
        final_state = await medgraph_workflow.ainvoke(initial_state)
        total_ms = int((time.perf_counter() - t_start) * 1000)

        return {
            "telemetry": {
                "total_pipeline_ms": f"{total_ms}ms",
                "agent_trace": final_state["agent_trace"],
                "graph_database": "FalkorDB medgraph_hospital_brain"
            },
            "sanitized_notes": final_state["sanitized_notes"],
            "extracted_entities": final_state.get("extracted_entities", {}),
            "graph_paths": final_state["graph_paths"],
            "clinical_analysis": final_state["llm_analysis"],
            "requires_physician_lock": final_state["requires_physician_lock"]
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Pipeline Error: {str(e)}")

@app.post("/api/sign-off")
async def physician_sign_off(req: SignOffInput):
    """FalkorDB Closed-Loop AuditLog Node write-back (Track 2 & Track 3)."""
    try:
        now_ts = time.strftime("%Y-%m-%d %H:%M:%S")
        res = graph.query("""
        MERGE (d:Doctor {name: $doc})
        MERGE (enc:Encounter {id: $enc_id})
        CREATE (a:AuditLog {
            action: $action,
            timestamp: $ts,
            notes: $notes
        })
        MERGE (d)-[:SIGNED_OFF {action: $action, timestamp: $ts}]->(enc)
        MERGE (enc)-[:HAS_AUDIT]->(a)
        RETURN d.name, enc.id, a.action, a.timestamp
        """, {
            "doc": req.doctor_name,
            "enc_id": req.encounter_id,
            "action": req.action,
            "ts": now_ts,
            "notes": req.notes
        })
        return {
            "status": "success",
            "message": f"Closed-loop physician audit log recorded in FalkorDB: {req.doctor_name} -> {req.action} on {req.encounter_id}",
            "audit": {
                "doctor": req.doctor_name,
                "encounter": req.encounter_id,
                "action": req.action,
                "timestamp": now_ts
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit writeback error: {str(e)}")


@app.post("/api/ontology/ingest")
async def ingest_ontology_file(file: UploadFile = File(...)):
    """
    Dual-agent ingestion endpoint for PDF/CSV knowledge loading into FalkorDB.

    Accepts CSV or PDF files containing drug-drug interaction data.
    Processes through:
    1. Data Mapping Agent (extracts and normalizes entities)
    2. Database Graph Agent (executes Cypher MERGE queries in FalkorDB)

    Returns combined output from both agents.
    """
    if not os.getenv("AMD_API_KEY"):
        raise HTTPException(status_code=500, detail="Missing AMD_API_KEY in backend .env")

    # Validate file type
    if not file.filename.lower().endswith(('.csv', '.pdf')):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only CSV and PDF files are supported."
        )

    try:
        # Read file content
        file_bytes = await file.read()

        # Run the dual-agent pipeline
        result = await run_ontology_ingestion_pipeline(file_bytes, file.filename)

        return {
            "status": "success",
            "message": f"Successfully ingested {result['total_entities']} entities from {file.filename}",
            "pipeline_result": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline error: {str(e)}")