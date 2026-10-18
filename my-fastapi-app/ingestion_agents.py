import os
import json
import csv
import time
import io
from typing import List, Dict, Optional, Union
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from falkordb import FalkorDB
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

AMD_API_KEY = os.getenv("AMD_API_KEY")
AMD_BASE_URL = os.getenv("AMD_BASE_URL", "https://notebooks.amd.com/tokenfactory/api/v1")

# Initialize LLM for PDF extraction (using AMD ROCm Gemma-4-31B-IT)
gemma_llm = ChatOpenAI(
    model="Gemma-4-31B-IT",
    api_key=AMD_API_KEY,
    base_url=AMD_BASE_URL,
    temperature=0.1
)

# Initialize FalkorDB
db = FalkorDB(host='localhost', port=6379)
graph = db.select_graph("medgraph_hospital_brain")


# =====================================================================
# AGENT 1: Data Mapping Agent
# =====================================================================

async def data_mapping_agent(raw_data: Union[str, bytes], source_type: str) -> Dict:
    """
    Agent 1: Responsible for entity extraction, semantic normalization, and JSON schema validation.

    For CSV: Reads tabular rows, validates required columns, and maps them to standard schema.
    For PDF: Reads extracted text with pypdf, invokes AMD ROCm Gemma-4-31B-IT using a strict
            schema extraction prompt, and produces a validated list of relationship tuples.

    Args:
        raw_data: CSV content as string or PDF content as bytes
        source_type: "csv" or "pdf"

    Returns:
        Dict with "mappings" list of validated relationship tuples
    """
    t0 = time.perf_counter()

    try:
        if source_type == "csv":
            mappings = await _process_csv(raw_data)
        elif source_type == "pdf":
            mappings = await _process_pdf(raw_data)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

        latency = int((time.perf_counter() - t0) * 1000)

        return {
            "mappings": mappings,
            "telemetry": {
                "source_type": source_type,
                "entities_extracted": len(mappings),
                "latency_ms": latency
            }
        }
    except Exception as e:
        logger.error(f"Data Mapping Agent error: {e}")
        raise


async def _process_csv(csv_content: str) -> List[Dict]:
    """Process CSV file and extract drug-drug interaction mappings."""
    mappings = []

    try:
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))

        # Validate required columns
        required_columns = ['drug1', 'drug2', 'pathway', 'risk', 'severity']
        if not all(col in csv_reader.fieldnames for col in required_columns):
            raise ValueError(f"CSV must contain columns: {required_columns}")

        for row_num, row in enumerate(csv_reader, start=1):
            try:
                # Skip empty rows
                if not any(row.values()):
                    logger.warning(f"Skipping empty row {row_num}")
                    continue

                # Validate severity
                severity = row.get('severity', '').upper()
                if severity not in ['CRITICAL', 'HIGH', 'MODERATE']:
                    logger.warning(f"Row {row_num}: Invalid severity '{severity}', defaulting to MODERATE")
                    severity = 'MODERATE'

                mapping = {
                    "drug1": row['drug1'].strip(),
                    "drug2": row['drug2'].strip(),
                    "pathway": row['pathway'].strip(),
                    "risk": row['risk'].strip(),
                    "severity": severity,
                    "safe_alternative": row.get('safe_alternative', '').strip() or "Not specified",
                    "specialist_name": row.get('specialist_name', '').strip() or "Dr. Sarah Jenkins, MD",
                    "specialist_dept": row.get('specialist_dept', '').strip() or "Cardiology"
                }

                # Validate required fields are not empty
                if not all([mapping['drug1'], mapping['drug2'], mapping['pathway'], mapping['risk']]):
                    logger.warning(f"Row {row_num}: Missing required fields, skipping")
                    continue

                mappings.append(mapping)

            except Exception as e:
                logger.warning(f"Row {row_num}: Error processing row - {e}, skipping")
                continue

        logger.info(f"CSV processing complete: {len(mappings)} valid mappings extracted")
        return mappings

    except Exception as e:
        logger.error(f"CSV processing error: {e}")
        raise


async def _process_pdf(pdf_bytes: bytes) -> List[Dict]:
    """Process PDF file using pypdf and LLM-based schema extraction."""
    try:
        from pypdf import PdfReader

        # Extract text from PDF
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"

        if not text_content.strip():
            raise ValueError("PDF is empty or could not extract text")

        logger.info(f"PDF text extracted: {len(text_content)} characters")

        # Use LLM to extract structured data
        extraction_prompt = f"""You are a clinical data extraction agent. Extract drug-drug interaction relationships from the following medical text.

Extract each relationship as a JSON object with these exact fields:
- drug1: First medication name
- drug2: Second medication name
- pathway: Biological pathway mechanism
- risk: Clinical risk description
- severity: One of "CRITICAL", "HIGH", or "MODERATE"
- safe_alternative: Recommended safe alternative (if mentioned)
- specialist_name: Doctor name to escalate to (if mentioned)
- specialist_dept: Doctor department (if mentioned)

Return ONLY a valid JSON array of objects, no other text. If no relationships are found, return an empty array [].

Text to analyze:
{text_content}

Output format example:
[
  {{
    "drug1": "Warfarin",
    "drug2": "Aspirin",
    "pathway": "Dual Hemostatic Inhibition",
    "risk": "Major Systemic Hemorrhage",
    "severity": "CRITICAL",
    "safe_alternative": "Acetaminophen",
    "specialist_name": "Dr. Sarah Jenkins, MD",
    "specialist_dept": "Cardiology"
  }}
]"""

        response = await gemma_llm.ainvoke(extraction_prompt)
        content = response.content.strip()

        # Clean up JSON response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        # Parse JSON
        try:
            extracted_data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}. Content: {content[:500]}")
            # Try to fix common JSON issues
            content = content.replace('\n', ' ').replace('\r', '')
            extracted_data = json.loads(content)

        if not isinstance(extracted_data, list):
            logger.warning("LLM did not return a list, wrapping in list")
            extracted_data = [extracted_data]

        # Validate and normalize each mapping
        mappings = []
        for idx, item in enumerate(extracted_data):
            try:
                if not isinstance(item, dict):
                    logger.warning(f"Item {idx}: Not a dict, skipping")
                    continue

                # Normalize severity
                severity = item.get('severity', 'MODERATE').upper()
                if severity not in ['CRITICAL', 'HIGH', 'MODERATE']:
                    severity = 'MODERATE'

                mapping = {
                    "drug1": item.get('drug1', '').strip(),
                    "drug2": item.get('drug2', '').strip(),
                    "pathway": item.get('pathway', '').strip(),
                    "risk": item.get('risk', '').strip(),
                    "severity": severity,
                    "safe_alternative": item.get('safe_alternative', '').strip() or "Not specified",
                    "specialist_name": item.get('specialist_name', '').strip() or "Dr. Sarah Jenkins, MD",
                    "specialist_dept": item.get('specialist_dept', '').strip() or "Cardiology"
                }

                # Validate required fields
                if not all([mapping['drug1'], mapping['drug2'], mapping['pathway'], mapping['risk']]):
                    logger.warning(f"Item {idx}: Missing required fields, skipping")
                    continue

                mappings.append(mapping)

            except Exception as e:
                logger.warning(f"Item {idx}: Error processing - {e}, skipping")
                continue

        logger.info(f"PDF processing complete: {len(mappings)} valid mappings extracted")
        return mappings

    except ImportError:
        logger.error("pypdf not installed. Run: uv add pypdf")
        raise
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        raise


# =====================================================================
# AGENT 2: Database Graph Agent
# =====================================================================

async def database_graph_agent(graph_instance, mapped_entities: List[Dict]) -> Dict:
    """
    Agent 2: Receives the normalized JSON payload from Agent 1.
    Executes deterministic Cypher MERGE queries in FalkorDB.

    Creates:
    - Medication nodes
    - BiologicalPathway nodes
    - ClinicalRisk nodes
    - Alternative nodes
    - Doctor nodes
    - Edges: INTERACTS_WITH, TRIGGERS_PATHWAY, CAUSES_RISK, RECOMMENDED_ALTERNATIVE, ESCALATE_TO

    Returns execution telemetry.
    """
    t0 = time.perf_counter()

    nodes_created = 0
    relationships_created = 0
    errors = []

    for idx, entity in enumerate(mapped_entities):
        try:
            drug1 = entity['drug1']
            drug2 = entity['drug2']
            pathway = entity['pathway']
            risk = entity['risk']
            severity = entity['severity']
            safe_alternative = entity['safe_alternative']
            specialist_name = entity['specialist_name']
            specialist_dept = entity['specialist_dept']

            # Execute MERGE queries for nodes and edges
            query = """
            MERGE (m1:Medication {name: $drug1})
            MERGE (m2:Medication {name: $drug2})
            MERGE (p:BiologicalPathway {name: $pathway})
            MERGE (r:ClinicalRisk {name: $risk, severity: $severity})
            MERGE (alt:Alternative {name: COALESCE($safe_alternative, 'Not specified')})
            MERGE (doc:Doctor {name: $specialist_name, dept: COALESCE($specialist_dept, 'General Medicine')})

            MERGE (m1)-[:INTERACTS_WITH]->(m2)
            MERGE (m1)-[:TRIGGERS_PATHWAY]->(p)
            MERGE (m2)-[:TRIGGERS_PATHWAY]->(p)
            MERGE (p)-[:CAUSES_RISK]->(r)
            MERGE (r)-[:RECOMMENDED_ALTERNATIVE]->(alt)
            MERGE (r)-[:ESCALATE_TO]->(doc)

            RETURN 'success'
            """

            params = {
                "drug1": drug1,
                "drug2": drug2,
                "pathway": pathway,
                "risk": risk,
                "severity": severity,
                "safe_alternative": safe_alternative if safe_alternative else "Not specified",
                "specialist_name": specialist_name,
                "specialist_dept": specialist_dept if specialist_dept else "General Medicine"
            }

            result = graph_instance.query(query, params)
            nodes_created += 6  # 6 nodes created per entity
            relationships_created += 5  # 5 edges created per entity

        except Exception as e:
            error_msg = f"Entity {idx}: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            continue

    # Verification query
    try:
        verify_query = """
        MATCH (m:Medication)-[:INTERACTS_WITH]->(:Medication)
        RETURN count(*) as interaction_count
        """
        verify_result = graph_instance.query(verify_query)
        interaction_count = verify_result.result_set[0][0] if verify_result.result_set else 0
    except Exception as e:
        logger.error(f"Verification query error: {e}")
        interaction_count = 0

    latency = int((time.perf_counter() - t0) * 1000)

    return {
        "status": "success" if not errors else "partial_success",
        "telemetry": {
            "nodes_created": nodes_created,
            "relationships_created": relationships_created,
            "entities_processed": len(mapped_entities),
            "errors_count": len(errors),
            "errors": errors[:10],  # Limit to first 10 errors
            "verified_interactions": interaction_count,
            "latency_ms": latency
        }
    }


# =====================================================================
# PIPELINE ORCHESTRATOR
# =====================================================================

async def run_ontology_ingestion_pipeline(file_bytes: bytes, filename: str) -> Dict:
    """
    Async pipeline orchestrator that connects Agent 1 and Agent 2.

    Args:
        file_bytes: File content as bytes
        filename: Name of the file (used to determine source type)

    Returns:
        Combined output from both agents
    """
    logger.info(f"Starting ontology ingestion pipeline for: {filename}")

    # Determine source type
    if filename.lower().endswith('.csv'):
        source_type = 'csv'
        raw_data = file_bytes.decode('utf-8')
    elif filename.lower().endswith('.pdf'):
        source_type = 'pdf'
        raw_data = file_bytes
    else:
        raise ValueError("Unsupported file type. Only CSV and PDF are supported.")

    # Agent 1: Data Mapping
    logger.info("Running Agent 1: Data Mapping Agent")
    mapping_output = await data_mapping_agent(raw_data, source_type)

    # Agent 2: Database Graph
    logger.info("Running Agent 2: Database Graph Agent")
    graph_output = await database_graph_agent(graph, mapping_output['mappings'])

    logger.info(f"Pipeline complete. Processed {len(mapping_output['mappings'])} entities")

    return {
        "filename": filename,
        "agent1_output": mapping_output,
        "agent2_output": graph_output,
        "total_entities": len(mapping_output['mappings'])
    }
