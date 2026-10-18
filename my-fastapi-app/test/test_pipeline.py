import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from falkordb import FalkorDB

load_dotenv()

# 1. Initialize AMD Model (Gemma-4-31B-IT)
llm = ChatOpenAI(
    model="Gemma-4-31B-IT",
    api_key=os.getenv("AMD_API_KEY"),
    base_url=os.getenv("AMD_BASE_URL"),
    temperature=0.1
)

# 2. Initialize FalkorDB & Seed Sample Knowledge Graph
db = FalkorDB(host='localhost', port=6379)
graph = db.select_graph("medgraph_hospital_brain")

seed_query = """
MERGE (w:Medication {name: 'Warfarin'})
MERGE (a:Medication {name: 'Aspirin'})
MERGE (mech:BiologicalPathway {name: 'Platelet Aggregation Pathway'})
MERGE (risk:ClinicalRisk {name: 'Major Bleeding & Hemorrhage', severity: 'CRITICAL'})
MERGE (w)-[:MODULATES]->(mech)
MERGE (a)-[:INHIBITS]->(mech)
MERGE (mech)-[:TRIGGERS_RISK]->(risk)
"""
graph.query(seed_query)

# 3. Simulate Agent Reasoning
clinical_note = "Patient on Warfarin 5mg prescribed Aspirin 325mg daily."
print("--- RUNNING AMD LLM + FALKORDB TEST ---")

# LLM Call
response = llm.invoke(f"Analyze this note for medication risks: {clinical_note}")
print("Gemma-4-31B-IT Output:", response.content)

# FalkorDB Traversal Query
traversal_res = graph.query("""
MATCH (m1:Medication {name: 'Warfarin'})-[:MODULATES]->(p:BiologicalPathway)<-[:INHIBITS]-(m2:Medication {name: 'Aspirin'})
MATCH (p)-[:TRIGGERS_RISK]->(r:ClinicalRisk)
RETURN m1.name, m2.name, p.name, r.name, r.severity
""")

for row in traversal_res.result_set:
    print(f"FalkorDB Multi-Hop Path Found: [{row[0]} + {row[1]}] ➔ ({row[2]}) ➔ ⚠️ [{row[3]} | Severity: {row[4]}]")