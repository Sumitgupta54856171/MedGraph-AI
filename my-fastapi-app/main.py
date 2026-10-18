import os
from turtle import st


from fastapi import FastAPI,HTTPException
import time
from dotenv import load_dotenv
from typing import List,Optional
from fastapi.middleware.cors import  CORSMiddleware
from pydantic import  BaseModel,Field
from openai import  AsyncOpenAI
from agents.agent_graph import medgraph_workflow


load_dotenv()

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

AMD_API_KEY= os.getenv("AMD_API_KEY")
AMD_BASE_URL = os.getenv("AMD_BASE_URL")

class EncounterInput(BaseModel):
    clinical_notes: str = Field(..., min_length=5, description="Live doctor clinical notes")
    target_language: str = Field(default="English")
    autonomous_floor: int = Field(default=80)

@app.get("/")
def main():
    return {"message": "Hello World"}

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "orchestrator": "LangGraph Stateful Multi-Agent Pipeline",
        "infrastructure": "AMD ROCm Cloud + FalkorDB Graph Database",
        "active_agents": [
            "1. pii_guard_node",
            "2. graph_reasoning_node (FalkorDB Multi-Hop)",
            "3. gemma_clinical_node (Gemma-4-31B-IT)"
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
            "sanitized_notes": "",
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
            "graph_paths": final_state["graph_paths"],
            "clinical_analysis": final_state["llm_analysis"],
            "requires_physician_lock": final_state["requires_physician_lock"]
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Pipeline Error: {str(e)}")