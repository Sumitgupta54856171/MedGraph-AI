# 🧠 MedGraph AI: Agentic Clinical Knowledge Graph & Discharge Safety Engine

> **Repository:** [https://github.com/Sumitgupta54856171/MedGraph-AI.git](https://github.com/Sumitgupta54856171/MedGraph-AI.git)  
> **Powered By:** **FalkorDB (`medgraph_hospital_brain`)** · **AMD ROCm Cloud (`Gemma-4-31B-IT` + `DeepSeek-V4.1-Flash`)** · **LangGraph** · **FastAPI** · **Next.js + MUI** · **PostgreSQL**

---

## 🏆 Hackathon Tracks Entered

We are entering **all three tracks** of **FalkorDB Graph Hacks**:

1. **Agents That Act on Connected Data:**  
   Our clinical triage agents traverse a 5-hop pharmacological graph in FalkorDB (`Patient` ➔ `Medication` ➔ `BiologicalPathway` ➔ `ClinicalRisk` ➔ `Alternative` & `Doctor`) to autonomously block life-threatening prescriptions, recommend safe therapeutic swaps, and lock patient discharge until reviewed.
2. **Agent Memory and Coordination:**  
   Uses FalkorDB as a persistent multi-agent coordination and episodic memory layer across four specialized agents (`Data_Mapping_Agent`, `Database_Graph_Agent`, `FalkorDB_Graph_Traversal_Agent`, and `Clinical_Safety_Agent`) plus closed-loop physician sign-off write-backs (`[:APPROVED_SUMMARY]`).
3. **Company Brain (Hospital Brain):**  
   Functions as a centralized institutional knowledge graph (`medgraph_hospital_brain`) unifying hospital clinical practice guidelines (PDFs), formulary drug-interaction tables (CSVs), biological pathways, and departmental escalation rosters (`Cardiology`, `Nephrology`).

---

## ⚙️ Why FalkorDB Does Real Work

In **MedGraph AI**, FalkorDB is **not** a visualization layer or decorative cache—**it is the deterministic clinical decision and memory engine that drives the entire product**:

* **Without FalkorDB, the Safety Gate cannot function:** LLMs alone hallucinate dosages and miss indirect multi-pathway contraindications. Our system relies on FalkorDB multi-hop Cypher traversal to deterministically prove how two medications (e.g., `Warfarin 5mg` + `Aspirin 325mg`) converge on hemostatic pathways (`VKORC1` + `COX-1 Platelet Aggregation`) to cause `Major Systemic & Intracranial Hemorrhage`.
* **Dynamic Graph Mutation in Real Time:** Every clinical note and uploaded PDF/CSV guideline directly mutates FalkorDB via parameterized `MERGE` queries.
* **Sub-Millisecond Execution:** FalkorDB executes our 5-hop clinical reasoning path in **~1ms**, enabling real-time emergency triage without latency bottlenecks.

---

## 🎯 Overview

MedGraph AI is a dual-LLM clinical safety platform that uses graph databases and advanced AI to detect drug-drug interactions, analyze clinical risks, and provide safe alternatives for physicians and patients.

### Key Features

- **Role-Based Authentication**: Doctor and Patient portals with secure PostgreSQL authentication
  - Doctors can signup with email, mobile, and department
  - Patients are registered by doctors (mobile-based login, mobile = password)
  - Doctor note/reason field for specialization details
- **3-Layer FalkorDB Architecture**:
  - Layer 1: Medical Ontology Bootstrap (pre-loaded knowledge base)
  - Layer 2: Live LLM Text-to-Graph Extraction
  - Layer 3: Cross-Session Episodic Memory & Physician Decision Logging
- **Dual-Agent Ingestion Pipeline**: Upload CSV/PDF files to update the knowledge base
- **Real-time Clinical Analysis**: AMD ROCm Cloud (Gemma-4-31B-IT + DeepSeek-V4.1-Flash) for clinical safety verification and patient generative UI
- **File-Based Analysis**: Upload PDF or image files for clinical document analysis
- **Physician Gate**: Digital sign-off system for discharge summaries
- **Patient Companion**: Patient-friendly discharge information with unlock mechanism
- **Complete Audit Trail**: FalkorDB tracks all physician decisions and patient history

---

## 🏗️ Architecture

### Backend (FastAPI)
- **Database**: PostgreSQL for user data and encounters
- **Graph Database**: FalkorDB for medical knowledge graph
- **AI Model**: AMD ROCm Cloud (Gemma-4-31B-IT for clinical safety verification & DeepSeek-V4.1-Flash for patient discharge GenUI)
- **Framework**: FastAPI with SQLAlchemy ORM

### Frontend (Next.js)
- **UI Framework**: Material-UI (MUI)
- **State Management**: TanStack Query
- **Routing**: Next.js App Router with role-based pages
- **Authentication**: JWT-based with localStorage

---

## �️ Graph Data Model (`medgraph_hospital_brain`)

### Node Labels & Properties
| Node Label | Key Properties | Description |
| :--- | :--- | :--- |
| `:Patient` | `mrn`, `name`, `age_sex` | Synthetic patient entity (`PT-8491`, `M. Reyes`, `58M`) |
| `:Encounter` | `id`, `status`, `date` | Clinical triage episode (`ENC-9082-TX`, `LOCKED` / `APPROVED`) |
| `:Medication` | `name`, `class`, `dosage` | Active or newly ordered drugs (`Warfarin`, `Aspirin`, `Lisinopril`, `Spironolactone`) |
| `:Condition` | `name`, `icd10` | Diagnosed clinical conditions (`Atrial Fibrillation I48.91`, `CKD Stage 3 N18.3`) |
| `:BiologicalPathway` | `name` | Pharmacological mechanism (`Dual Hemostatic Inhibition (VKORC1 + COX-1)`) |
| `:ClinicalRisk` | `name`, `severity` | Adverse event (`Major Systemic & Intracranial Hemorrhage`, `CRITICAL`) |
| `:Alternative` | `name`, `rationale` | Verified safe therapeutic substitute (`Acetaminophen` or `Low-Dose Aspirin 81mg + Pantoprazole 40mg`) |
| `:Doctor` | `name`, `dept` | Attending specialist responsible for escalation & sign-off (`Dr. Sarah Jenkins, MD`, `Cardiology`) |

### Graph Topology (Multi-Hop Schema Diagram)
```text
(:Patient {mrn: "PT-8491"})
   ├──[:DIAGNOSED_WITH]────────► (:Condition {name: "Atrial Fibrillation"})
   └──[:PRESCRIBED]────────────► (:Medication {name: "Warfarin"})
                                        │
                                 [:INTERACTS_WITH] (Hop 1)
                                        ▼
                                 (:Medication {name: "Aspirin"})
                                        │
                                [:TRIGGERS_PATHWAY] (Hop 2)
                                        ▼
                         (:BiologicalPathway {name: "VKORC1 + COX-1 Inhibition"})
                                        │
                                  [:CAUSES_RISK] (Hop 3)
                                        ▼
                         (:ClinicalRisk {name: "Major Hemorrhage", severity: "CRITICAL"})
                                  /                      \
      (Hop 4) [:RECOMMENDED_ALTERNATIVE]            [:ESCALATE_TO] (Hop 5)
                        ▼                                         ▼
     (:Alternative {name: "Acetaminophen /            (:Doctor {name: "Dr. Sarah Jenkins, MD",
       Low-Dose 81mg + Pantoprazole 40mg"})                     dept: "Cardiology"})
                                                                  │
                                               [:APPROVED_SUMMARY {timestamp, action}]
                                                                  ▼
                                                   (:Encounter {id: "ENC-9082-TX"})
```

---

## 🔍 Core Cypher Queries Used by the Product

### 1. 5-Hop Pharmacological Interaction, Safe Alternative & Specialist Escalation Query
Executed dynamically during every clinical triage analysis in `agents/agent_graph.py`:
```cypher
MATCH (m1:Medication)-[:INTERACTS_WITH]->(m2:Medication)
      -[:TRIGGERS_PATHWAY]->(p:BiologicalPathway)
      -[:CAUSES_RISK]->(r:ClinicalRisk)
WHERE m1.name IN $drugs AND m2.name IN $drugs
OPTIONAL MATCH (r)-[:RECOMMENDED_ALTERNATIVE]->(alt:Alternative)
OPTIONAL MATCH (r)-[:ESCALATE_TO]->(doc:Doctor)
RETURN m1.name AS drug_1,
       m2.name AS drug_2,
       p.name AS biological_pathway,
       r.name AS clinical_risk,
       r.severity AS severity,
       alt.name AS safe_alternative,
       doc.name AS specialist,
       doc.dept AS department
```

### 2. Two-Agent Document-to-Graph Ontology Ingestion (`Database_Graph_Agent`)
Executed when doctors or hospital admins upload PDF guidelines or CSV drug databases to `/api/ontology/ingest`:
```cypher
MERGE (m1:Medication {name: $drug1})
MERGE (m2:Medication {name: $drug2})
MERGE (p:BiologicalPathway {name: $pathway})
MERGE (r:ClinicalRisk {name: $risk, severity: $severity})
MERGE (alt:Alternative {name: $safe_alternative})
MERGE (doc:Doctor {name: $specialist_name, dept: $specialist_dept})

MERGE (m1)-[:INTERACTS_WITH]->(m2)
MERGE (m2)-[:TRIGGERS_PATHWAY]->(p)
MERGE (p)-[:CAUSES_RISK]->(r)
MERGE (r)-[:RECOMMENDED_ALTERNATIVE]->(alt)
MERGE (r)-[:ESCALATE_TO]->(doc)
```

### 3. Live Patient Encounter & Episodic Physician Sign-Off Write-Back
Executed when an attending physician approves or overrides a locked encounter:
```cypher
MERGE (p:Patient {mrn: $mrn})
MERGE (e:Encounter {id: $enc_id})
MERGE (d:Doctor {name: $doc_name})
MERGE (p)-[:HAD_ENCOUNTER]->(e)
MERGE (d)-[:APPROVED_SUMMARY {timestamp: timestamp(), action: $action}]->(e)
```

---

## 🚀 Complete Local Setup Instructions

### Prerequisites
* Docker & Docker Compose
* Python 3.12+ with `uv` (or `pip`)
* Node.js 18+ & `npm`
* AMD ROCm API key

### 1. Start FalkorDB & PostgreSQL via Docker
```bash
# Start FalkorDB on port 6379
docker run -d --name medgraph-falkordb -p 6379:6379 -p 3001:3000 falkordb/falkordb:latest

# Start PostgreSQL on port 5432
docker run -d --name medgraph-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=medgraph_db \
  -p 5432:5432 postgres:16-alpine
```

### 2. Configure & Run FastAPI Backend (`my-fastapi-app`)
```bash
cd my-fastapi-app

# Create .env file
cat <<EOF> .env
AMD_API_KEY=your_amd_api_key_here
AMD_BASE_URL=https://developer.amd.com.cn/radeon/api/v1
PRIMARY_CLINICAL_MODEL=Gemma-4-31B-IT
PATIENT_GENUI_MODEL=DeepSeek-V4.1-Flash
VOICE_MODEL=OmniVoice
POSTGRES_URL=postgresql://postgres:mysecretpassword@localhost:5432/medgraph_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
EOF

# Install dependencies
uv sync

# Initialize database
.venv/bin/python init_db.py

# Bootstrap FalkorDB knowledge graph
.venv/bin/python graph_db.py

# Start server
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Configure & Run Next.js Frontend (`medbgraphai`)
```bash
cd ../medbgraphai
npm install
npm run dev
```
Open `http://localhost:3001` in your browser.

---

## 👥 Demo Accounts

### Doctor Account
- **Email:** sarah.jenkins@medgraph.ai
- **Mobile:** 9876543210
- **Password:** doctor123
- **Name:** Dr. Sarah Jenkins, MD
- **Department:** Cardiology
- **Note:** Senior Cardiologist specializing in anticoagulation therapy

### Patient Account
- **Mobile:** 1234567890
- **Password:** 1234567890 (mobile number is the password)
- **Name:** M. Reyes
- **MRN:** PT-8491

**Note:** Patients cannot signup directly. They are registered by doctors. Patient login uses mobile number as both username and password.

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new doctor (patients cannot signup directly)
- `POST /api/auth/login` - Login with email or mobile and get JWT token

### Clinical Analysis
- `POST /api/analyze` - Run clinical analysis pipeline (drug interactions, risks, alternatives)
- `POST /api/analyze/file` - Run clinical analysis from uploaded PDF or image file

### Encounters
- `POST /api/encounter/create` - Create new encounter in PostgreSQL
- `POST /api/encounter/approve` - Approve encounter and log decision in FalkorDB
- `GET /api/encounter/patient/{mrn}/history` - Get patient encounter history (PostgreSQL + FalkorDB)

### Doctor Admin
- `POST /api/doctor/admin/ingest-data` - Upload CSV/PDF to update knowledge base
- `GET /api/doctor/admin/stats` - Get knowledge base statistics

### Ontology Ingestion
- `POST /api/ontology/ingest` - Dual-agent ingestion for CSV/PDF files

---

## 🌐 Frontend Pages

- **/** - Login/Signup landing page with role-based redirect
- **/clinical-triage** - Doctor's clinical triage dashboard with PDF/image upload
- **/patient** - Patient discharge companion view
- **/doctor** - Doctor admin portal for data upload

---

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

---

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (DOCTOR vs PATIENT)
- Password hashing with bcrypt
- PII sanitization in clinical notes
- Physician sign-off requirement for discharge
- Mobile-based patient authentication

---

## 🧪 Testing

### Test Clinical Analysis
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "clinical_notes": "Pt 58M c/o acute substernal CP radiating to L arm. Hx of AFib on Warfarin 5mg.",
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

### Test Patient Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "1234567890", "password": "1234567890"}'
```

---

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
├── script.txt               # Video script for graph database
├── test_interactions.csv    # Sample data file
└── README.md                # This file
```

---

## 🛡️ Data Privacy & Synthetic Data Statement

All patient records (including `M. Reyes`, `MRN: PT-8491`, `Encounter: ENC-9082-TX`), clinical notes, and hospital rosters used in this project are **100% synthetic data** created specifically for demonstration purposes, combined with publicly available clinical pharmacology knowledge (standard drug interactions, biological pathways, and ICD-10 terminology). No real, personal, or HIPAA-protected patient information is stored or processed.

---

## 🤖 AI Coding Assistants & Tooling Disclosure

In strict accordance with hackathon guidelines, we disclose that AI assistants (Claude Code / Cursor CLI) were used during the hackathon to assist with boilerplate code scaffolding, drafting UI components, formatting documentation, and generating synthetic clinical test documents. The system architecture, multi-hop FalkorDB graph data model, Cypher query logic, two-agent ingestion pipeline design, and backend/frontend debugging were conceived, verified, and integrated by the developer.

---

## ⚠️ Disclaimer

This system is for demonstration and educational purposes only. It does not replace professional medical judgment. All clinical decisions must be made by licensed healthcare professionals.

---

## 📄 License

This project is provided as-is for educational and demonstration purposes.
