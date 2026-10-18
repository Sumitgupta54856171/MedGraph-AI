# MedGraph AI

Clinical Intelligence & Patient Safety Platform powered by AMD ROCm, FalkorDB, and PostgreSQL.

## 🎯 Overview

MedGraph AI is a dual-LLM clinical safety platform that uses graph databases and advanced AI to detect drug-drug interactions, analyze clinical risks, and provide safe alternatives for physicians and patients.

### Key Features

- **Role-Based Authentication**: Doctor and Patient portals with secure PostgreSQL authentication
- **3-Layer FalkorDB Architecture**:
  - Layer 1: Medical Ontology Bootstrap (pre-loaded knowledge base)
  - Layer 2: Live LLM Text-to-Graph Extraction
  - Layer 3: Cross-Session Episodic Memory & Physician Decision Logging
- **Dual-Agent Ingestion Pipeline**: Upload CSV/PDF files to update the knowledge base
- **Real-time Clinical Analysis**: AMD ROCm Gemma-4-31B-IT for clinical safety verification
- **Physician Gate**: Digital sign-off system for discharge summaries
- **Patient Companion**: Patient-friendly discharge information with unlock mechanism

## 🏗️ Architecture

### Backend (FastAPI)
- **Database**: PostgreSQL for user data and encounters
- **Graph Database**: FalkorDB for medical knowledge graph
- **AI Model**: AMD ROCm Gemma-4-31B-IT for clinical analysis
- **Framework**: FastAPI with SQLAlchemy ORM

### Frontend (Next.js)
- **UI Framework**: Material-UI (MUI)
- **State Management**: TanStack Query
- **Routing**: Next.js App Router with role-based pages
- **Authentication**: JWT-based with localStorage

## 📋 Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL (running on localhost:5432)
- FalkorDB (running on localhost:6379)
- AMD ROCm API key

## 🚀 Setup Instructions

### 1. Backend Setup

```bash
cd my-fastapi-app

# Install dependencies
uv sync

# Set up environment variables
# Edit .env file with your credentials
```

**Environment Variables (.env):**
```env
AMD_API_KEY=your_amd_api_key
AMD_BASE_URL=https://developer.amd.com.cn/radeon/api/v1
PRIMARY_CLINICAL_MODEL=Gemma-4-31B-IT
PATIENT_GENUI_MODEL=DeepSeek-V4.1-Flash
VOICE_MODEL=OmniVoice
POSTGRES_URL=postgresql://postgres:mysecretpassword@localhost:5432/medgraph_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

**Initialize Database:**
```bash
# Run database initialization
.venv/bin/python init_db.py

# Bootstrap FalkorDB knowledge graph
.venv/bin/python graph_db.py
```

**Start Backend:**
```bash
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd medbgraphai

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:3001

### 3. Start Services

**PostgreSQL (Docker):**
```bash
docker run -d --name postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 postgres
docker exec postgres psql -U postgres -c "CREATE DATABASE medgraph_db;"
```

**FalkorDB (Docker):**
```bash
docker run -d --name medgraph-falkordb -p 6379:6379 falkordb/falkordb:latest
```

## 👥 Demo Accounts

### Doctor Account
- **Email:** sarah.jenkins@medgraph.ai
- **Password:** doctor123
- **Name:** Dr. Sarah Jenkins, MD
- **Department:** Cardiology

### Patient Account
- **Email:** m.reyes@patient.ai
- **Password:** patient123
- **Name:** M. Reyes
- **MRN:** PT-8491

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new doctor or patient
- `POST /api/auth/login` - Login and get JWT token

### Clinical Analysis
- `POST /api/analyze` - Run clinical analysis pipeline (drug interactions, risks, alternatives)

### Encounters
- `POST /api/encounter/approve` - Approve encounter and log decision in FalkorDB
- `GET /api/encounter/patient/{mrn}/history` - Get patient encounter history
- `POST /api/encounter/create` - Create new encounter record

### Doctor Admin
- `POST /api/doctor/admin/ingest-data` - Upload CSV/PDF to update knowledge base
- `GET /api/doctor/admin/stats` - Get knowledge base statistics

### Ontology Ingestion
- `POST /api/ontology/ingest` - Dual-agent ingestion for CSV/PDF files

## 🌐 Frontend Pages

- **/** - Login/Signup landing page with role-based redirect
- **/clinical-triage** - Doctor's clinical triage dashboard
- **/patient** - Patient discharge companion view
- **/doctor** - Doctor admin portal for data upload

## 📊 Data Ingestion Format

### CSV Format
```csv
drug1,drug2,pathway,risk,severity,safe_alternative,specialist_name,specialist_dept
Warfarin,Aspirin,Dual Hemostatic Inhibition,Major Systemic Hemorrhage,CRITICAL,Acetaminophen,Dr. Sarah Jenkins, MD,Cardiology
```

### Required Columns
- `drug1`: First medication name
- `drug2`: Second medication name
- `pathway`: Biological pathway mechanism
- `risk`: Clinical risk description
- `severity`: CRITICAL, HIGH, or MODERATE
- `safe_alternative`: Recommended safe alternative
- `specialist_name`: Doctor to escalate to
- `specialist_dept`: Doctor's department

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (DOCTOR vs PATIENT)
- Password hashing with bcrypt
- PII sanitization in clinical notes
- Physician sign-off requirement for discharge

## 🧪 Testing

### Test Clinical Analysis
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "clinical_notes": "Pt 58M c/o acute substernal CP radiating to L arm. Hx of AFib on Warfarin 5mg. Prescribed Aspirin 325mg daily.",
    "target_language": "English",
    "autonomous_floor": 80
  }'
```

### Test Data Ingestion
```bash
curl -X POST http://localhost:8000/api/ontology/ingest \
  -F "file=@test_interactions.csv"
```

### Test Doctor Admin Stats
```bash
curl http://localhost:8000/api/doctor/admin/stats
```

## 📁 Project Structure

```
MedGraph Ai/
├── my-fastapi-app/          # FastAPI Backend
│   ├── agents/              # LangGraph agents
│   │   └── agent_graph.py   # Clinical analysis pipeline
│   ├── routers/             # API routers
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── encounters.py    # Encounter management
│   │   └── doctor_admin.py  # Doctor admin endpoints
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # Database configuration
│   ├── auth.py              # Authentication utilities
│   ├── ingestion_agents.py  # Dual-agent ingestion pipeline
│   ├── graph_db.py          # FalkorDB bootstrap
│   ├── init_db.py           # Database initialization
│   └── main.py              # FastAPI application
├── medbgraphai/             # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx         # Landing page
│   │   ├── clinical-triage/ # Doctor dashboard
│   │   ├── patient/         # Patient view
│   │   └── doctor/          # Doctor admin portal
│   ├── components/          # React components
│   ├── services/            # API services
│   └── utils/               # Utility functions
└── test_interactions.csv    # Sample data file
```

## 🤝 Contributing

This is a clinical safety platform for educational and demonstration purposes. When contributing:

1. Follow the existing code structure
2. Test all changes before committing
3. Ensure no breaking changes to existing APIs
4. Update documentation as needed

## ⚠️ Disclaimer

This system is for demonstration and educational purposes only. It does not replace professional medical judgment. All clinical decisions must be made by licensed healthcare professionals.

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 🙏 Acknowledgments

- AMD ROCm for GPU-accelerated AI inference
- FalkorDB for graph database technology
- FastAPI for modern Python web framework
- Next.js for React framework
- Material-UI for UI components
