from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from models import User, Encounter, EncounterStatus
from falkordb import FalkorDB
import time

router = APIRouter(prefix="/api/encounter", tags=["Encounters"])

# FalkorDB connection for Layer 3
db_graph = FalkorDB(host='localhost', port=6379)
graph = db_graph.select_graph("medgraph_hospital_brain")


class ApproveRequest(BaseModel):
    encounter_id: str = Field(..., description="Encounter ID (e.g., ENC-9082-TX)")
    doctor_name: str = Field(..., description="Doctor name (e.g., Dr. Sarah Jenkins, MD)")
    patient_mrn: str = Field(..., description="Patient MRN (e.g., PT-8491)")
    action: str = Field(default="APPROVED", description="Action: APPROVED or OVERRIDDEN")
    notes: Optional[str] = Field(None, description="Optional notes")


class EncounterResponse(BaseModel):
    id: str
    patient_mrn: str
    doctor_id: int
    raw_notes: str
    sanitized_notes: Optional[str]
    clinical_analysis: Optional[str]
    status: EncounterStatus
    approved_by: Optional[int]
    updated_at: str


@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve_encounter(req: ApproveRequest, db: Session = Depends(get_db)):
    """Layer 3: Cross-Session Episodic Memory & Physician Decision Logging."""
    # Update encounter status in PostgreSQL
    encounter = db.query(Encounter).filter(Encounter.id == req.encounter_id).first()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )

    # Find doctor by name
    doctor = db.query(User).filter(User.name == req.doctor_name, User.role == "DOCTOR").first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    # Update encounter status
    encounter.status = EncounterStatus.APPROVED_UNLOCKED
    encounter.approved_by = doctor.id
    db.commit()

    # Layer 3: Write decision node into FalkorDB
    try:
        now_ts = time.strftime("%Y-%m-%d %H:%M:%S")
        graph.query("""
        MERGE (d:Doctor {name: $doc})
        MERGE (e:Encounter {id: $enc_id})
        MERGE (p:Patient {mrn: $mrn})
        CREATE (decision:Decision {
            action: $action,
            timestamp: timestamp(),
            notes: $notes
        })
        MERGE (d)-[:APPROVED_SUMMARY {timestamp: $ts, action: $action}]->(e)
        MERGE (e)-[:BELONGS_TO]->(p)
        MERGE (e)-[:HAS_DECISION]->(decision)
        RETURN d.name, e.id, decision.action, decision.timestamp
        """, {
            "doc": req.doctor_name,
            "enc_id": req.encounter_id,
            "mrn": req.patient_mrn,
            "action": req.action,
            "ts": now_ts,
            "notes": req.notes or "Physician digitally reviewed and approved clinical summary."
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"FalkorDB writeback error: {str(e)}"
        )

    return {
        "status": "success",
        "message": f"Encounter {req.encounter_id} approved by {req.doctor_name}. Decision logged in FalkorDB.",
        "encounter_id": req.encounter_id,
        "approved_by": req.doctor_name,
        "action": req.action,
        "timestamp": now_ts
    }


@router.get("/patient/{mrn}/history")
async def get_patient_history(mrn: str, db: Session = Depends(get_db)):
    """Get both PostgreSQL encounter status and FalkorDB cross-session episodic memory for a patient."""
    # Get PostgreSQL encounters
    encounters = db.query(Encounter).filter(Encounter.patient_mrn == mrn).all()

    encounter_list = []
    for enc in encounters:
        doctor = db.query(User).filter(User.id == enc.doctor_id).first()
        encounter_list.append({
            "id": enc.id,
            "patient_mrn": enc.patient_mrn,
            "doctor_name": doctor.name if doctor else "Unknown",
            "raw_notes": enc.raw_notes,
            "sanitized_notes": enc.sanitized_notes,
            "clinical_analysis": enc.clinical_analysis,
            "status": enc.status.value,
            "approved_by": enc.approved_by,
            "updated_at": enc.updated_at.isoformat() if enc.updated_at else None
        })

    # Get FalkorDB cross-session episodic memory
    try:
        res = graph.query("""
        MATCH (p:Patient {mrn: $mrn})-[:BELONGS_TO]-(e:Encounter)-[:HAS_DECISION]->(d:Decision)
        OPTIONAL MATCH (doc:Doctor)-[:APPROVED_SUMMARY]->(e)
        RETURN e.id, d.action, d.timestamp, d.notes, doc.name as doctor_name
        ORDER BY d.timestamp DESC
        """, {"mrn": mrn})

        episodic_memory = []
        for row in res.result_set:
            enc_id, action, timestamp, notes, doctor_name = row
            episodic_memory.append({
                "encounter_id": enc_id,
                "action": action,
                "timestamp": str(timestamp),
                "notes": notes,
                "doctor_name": doctor_name
            })
    except Exception as e:
        episodic_memory = []
        # Don't fail the entire request if FalkorDB query fails
        print(f"FalkorDB query error: {e}")

    return {
        "patient_mrn": mrn,
        "postgresql_encounters": encounter_list,
        "falkordb_episodic_memory": episodic_memory
    }


@router.post("/create", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED)
async def create_encounter(
    patient_mrn: str,
    doctor_id: int,
    raw_notes: str,
    sanitized_notes: Optional[str] = None,
    clinical_analysis: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Create a new encounter record in PostgreSQL."""
    # Generate encounter ID
    enc_id = f"ENC-{int(time.time() * 1000)}"

    new_encounter = Encounter(
        id=enc_id,
        patient_mrn=patient_mrn,
        doctor_id=doctor_id,
        raw_notes=raw_notes,
        sanitized_notes=sanitized_notes,
        clinical_analysis=clinical_analysis,
        status=EncounterStatus.LOCKED_PENDING_REVIEW
    )

    db.add(new_encounter)
    db.commit()
    db.refresh(new_encounter)

    return EncounterResponse(
        id=new_encounter.id,
        patient_mrn=new_encounter.patient_mrn,
        doctor_id=new_encounter.doctor_id,
        raw_notes=new_encounter.raw_notes,
        sanitized_notes=new_encounter.sanitized_notes,
        clinical_analysis=new_encounter.clinical_analysis,
        status=new_encounter.status,
        approved_by=new_encounter.approved_by,
        updated_at=new_encounter.updated_at.isoformat() if new_encounter.updated_at else None
    )
