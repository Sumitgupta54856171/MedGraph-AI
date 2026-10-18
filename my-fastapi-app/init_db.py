from database import engine, SessionLocal, Base
from models import User, UserRole
import bcrypt
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def init_db():
    """Create tables and seed default demo accounts."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")

    db = SessionLocal()

    try:
        # Check if demo doctor exists
        existing_doctor = db.query(User).filter(User.email == "sarah.jenkins@medgraph.ai").first()
        if not existing_doctor:
            demo_doctor = User(
                name="Dr. Sarah Jenkins, MD",
                email="sarah.jenkins@medgraph.ai",
                mobile="9876543210",
                password_hash=get_password_hash("doctor123"),
                role=UserRole.DOCTOR,
                department="Cardiology",
                mrn=None,
                note="Senior Cardiologist specializing in anticoagulation therapy"
            )
            db.add(demo_doctor)
            logger.info("Demo doctor account created: sarah.jenkins@medgraph.ai")
        else:
            logger.info("Demo doctor account already exists: sarah.jenkins@medgraph.ai")

        # Check if demo patient exists (using mobile as login)
        existing_patient = db.query(User).filter(User.mobile == "1234567890").first()
        if not existing_patient:
            demo_patient = User(
                name="M. Reyes",
                email=None,
                mobile="1234567890",
                password_hash=get_password_hash("1234567890"),  # Mobile is password
                role=UserRole.PATIENT,
                department=None,
                mrn="PT-8491",
                note=None
            )
            db.add(demo_patient)
            logger.info("Demo patient account created: 1234567890")
        else:
            logger.info("Demo patient account already exists: 1234567890")

        db.commit()
        logger.info("Database initialization completed successfully.")

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
