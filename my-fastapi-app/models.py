from sqlalchemy import Column, String, DateTime, Enum, Text, Integer
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"


class EncounterStatus(str, enum.Enum):
    LOCKED_PENDING_REVIEW = "LOCKED_PENDING_REVIEW"
    APPROVED_UNLOCKED = "APPROVED_UNLOCKED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)  # Optional for patients
    mobile = Column(String, unique=True, index=True, nullable=False)  # Mobile number as login credential
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department = Column(String, nullable=True)  # For doctors
    mrn = Column(String, nullable=True, unique=True)  # For patients
    note = Column(Text, nullable=True)  # For doctors - reason/note
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String, primary_key=True, index=True)  # e.g., "ENC-9082-TX"
    patient_mrn = Column(String, nullable=False, index=True)
    doctor_id = Column(Integer, nullable=False, index=True)
    raw_notes = Column(Text, nullable=False)
    sanitized_notes = Column(Text, nullable=True)
    clinical_analysis = Column(Text, nullable=True)
    status = Column(Enum(EncounterStatus), default=EncounterStatus.LOCKED_PENDING_REVIEW)
    approved_by = Column(Integer, nullable=True)  # Doctor ID who approved
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
