from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, UserRole
from ingestion_agents import run_ontology_ingestion_pipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/doctor/admin", tags=["Doctor Admin"])


async def verify_doctor(user_id: int, db: Session) -> User:
    """Verify user is a doctor."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can access admin endpoints")
    return user


@router.post("/ingest-data")
async def ingest_knowledge_base(
    file: UploadFile = File(...),
    doctor_id: int = None,  # In production, get from JWT token
    db: Session = Depends(get_db)
):
    """
    Doctor-only endpoint to ingest drug-drug interaction data from CSV or PDF.
    This is a simplified version of the ingestion endpoint for easy doctor use.
    """
    # Verify doctor (in production, verify from JWT token)
    if doctor_id:
        await verify_doctor(doctor_id, db)

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

        logger.info(f"Doctor {doctor_id} ingested {result['total_entities']} entities from {file.filename}")

        return {
            "status": "success",
            "message": f"Successfully ingested {result['total_entities']} entities from {file.filename}",
            "pipeline_result": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline error: {str(e)}")


@router.get("/stats")
async def get_admin_stats(
    doctor_id: int = None,
    db: Session = Depends(get_db)
):
    """Get statistics about the knowledge base (node counts, etc.)."""
    if doctor_id:
        await verify_doctor(doctor_id, db)

    from falkordb import FalkorDB

    db_graph = FalkorDB(host='localhost', port=6379)
    graph = db_graph.select_graph("medgraph_hospital_brain")

    try:
        # Get node counts
        medication_count = len(list(graph.query("MATCH (m:Medication) RETURN m.name").result_set))
        pathway_count = len(list(graph.query("MATCH (p:BiologicalPathway) RETURN p.name").result_set))
        risk_count = len(list(graph.query("MATCH (r:ClinicalRisk) RETURN r.name").result_set))
        interaction_count = len(list(graph.query("MATCH (m1:Medication)-[:INTERACTS_WITH]->(m2:Medication) RETURN m1.name, m2.name").result_set))

        return {
            "knowledge_base_stats": {
                "medications": medication_count,
                "biological_pathways": pathway_count,
                "clinical_risks": risk_count,
                "drug_interactions": interaction_count
            }
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve stats: {str(e)}")
