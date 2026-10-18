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
    password: str = Field(..., min_length=6, max_length=50)
    role: UserRole
    department: Optional[str] = Field(None, max_length=100)  # For doctors
    mrn: Optional[str] = Field(None, max_length=20)  # For patients


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    department: Optional[str]
    mrn: Optional[str]
    token: str


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new Doctor or Patient."""
    # Validate role-specific fields
    if req.role == UserRole.DOCTOR and not req.department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is required for doctors"
        )
    if req.role == UserRole.PATIENT and not req.mrn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MRN is required for patients"
        )

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if MRN already exists (for patients)
    if req.mrn:
        existing_mrn = db.query(User).filter(User.mrn == req.mrn).first()
        if existing_mrn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MRN already registered"
            )

    # Validate MRN format (e.g., PT-8491)
    if req.mrn and not re.match(r'^PT-\d{4,6}$', req.mrn):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MRN must be in format PT-XXXX (e.g., PT-8491)"
        )

    # Create new user
    hashed_password = get_password_hash(req.password)
    new_user = User(
        name=req.name,
        email=req.email,
        password_hash=hashed_password,
        role=req.role,
        department=req.department if req.role == UserRole.DOCTOR else None,
        mrn=req.mrn if req.role == UserRole.PATIENT else None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    token_data = {
        "sub": str(new_user.id),
        "email": new_user.email,
        "role": new_user.role.value
    }
    access_token = create_access_token(token_data)

    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        mrn=new_user.mrn,
        token=access_token
    )


@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Verify credentials and return user profile with token."""
    # Find user by email
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate JWT token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value
    }
    access_token = create_access_token(token_data)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department,
        mrn=user.mrn,
        token=access_token
    )
