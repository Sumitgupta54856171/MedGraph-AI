from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from database import get_db
from models import User, UserRole
from auth import verify_password, get_password_hash, create_access_token
import re

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile: str = Field(..., min_length=10, max_length=15, description="Mobile number")
    password: str = Field(..., min_length=6, max_length=50)
    role: UserRole
    department: Optional[str] = Field(None, max_length=100)  # For doctors
    note: Optional[str] = Field(None, max_length=500, description="Reason/Note for doctors")


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    mobile: str
    role: UserRole
    department: Optional[str]
    mrn: Optional[str]
    note: Optional[str]
    token: str


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new Doctor (patients cannot signup)."""
    # Only doctors can signup
    if req.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only doctors can signup. Patients are registered by doctors."
        )

    # Validate doctor-specific fields
    if not req.department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is required for doctors"
        )

    # Check if email already exists
    if req.email:
        existing_email = db.query(User).filter(User.email == req.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Check if mobile already exists
    existing_mobile = db.query(User).filter(User.mobile == req.mobile).first()
    if existing_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already registered"
        )

    # Validate mobile format (10 digits)
    if not re.match(r'^\d{10}$', req.mobile):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number must be 10 digits"
        )

    # Create new doctor
    hashed_password = get_password_hash(req.password)
    new_user = User(
        name=req.name,
        email=req.email,
        mobile=req.mobile,
        password_hash=hashed_password,
        role=UserRole.DOCTOR,
        department=req.department,
        mrn=None,
        note=req.note
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    token_data = {
        "sub": str(new_user.id),
        "email": new_user.email,
        "mobile": new_user.mobile,
        "role": new_user.role.value
    }
    access_token = create_access_token(token_data)

    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        mobile=new_user.mobile,
        role=new_user.role,
        department=new_user.department,
        mrn=new_user.mrn,
        note=new_user.note,
        token=access_token
    )


@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Verify credentials (email or mobile) and return user profile with token."""
    # Find user by email or mobile
    if req.email:
        user = db.query(User).filter(User.email == req.email).first()
    elif req.mobile:
        user = db.query(User).filter(User.mobile == req.mobile).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or mobile number required"
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Verify password
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Generate JWT token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "mobile": user.mobile,
        "role": user.role.value
    }
    access_token = create_access_token(token_data)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        role=user.role,
        department=user.department,
        mrn=user.mrn,
        note=user.note,
        token=access_token
    )
