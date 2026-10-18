from falkordb import FalkorDB

db = FalkorDB(host='localhost', port=6379)
graph = db.select_graph("medgraph_hospital_brain")


def bootstrap_medical_ontology():
    """Layer 1: Medical Ontology Bootstrap - Pre-Loaded Knowledge Base."""
    # Seed standard RxNorm medications
    graph.query("""
    MERGE (w:Medication {name: 'Warfarin', class: 'Anticoagulant', rxnorm: '8546'})
    MERGE (a:Medication {name: 'Aspirin', class: 'Antiplatelet', rxnorm: '1191'})
    MERGE (li:Medication {name: 'Lisinopril', class: 'ACE Inhibitor', rxnorm: '312079'})
    MERGE (sp:Medication {name: 'Spironolactone', class: 'K-Sparing Diuretic', rxnorm: '6237'})
    MERGE (ib:Medication {name: 'Ibuprofen', class: 'NSAID', rxnorm: '5640'})
    MERGE (at:Medication {name: 'Atorvastatin', class: 'Statin', rxnorm: '83367'})
    MERGE (met:Medication {name: 'Metformin', class: 'Biguanide', rxnorm: '860975'})
    MERGE (clo:Medication {name: 'Clopidogrel', class: 'Antiplatelet', rxnorm: '4837'})
    MERGE (dig:Medication {name: 'Digoxin', class: 'Cardiac Glycoside', rxnorm: '3068'})
    MERGE (furo:Medication {name: 'Furosemide', class: 'Loop Diuretic', rxnorm: '3494'})
    """)

    # Seed SNOMED-CT/ICD-10 conditions
    graph.query("""
    MERGE (afib:Condition {name: 'Atrial Fibrillation', icd10: 'I48.91', snomed: '164889003'})
    MERGE (ua:Condition {name: 'Unstable Angina', icd10: 'I20.0', snomed: '267036007'})
    MERGE (hyper:Condition {name: 'Hyperlipidemia', icd10: 'E78.5', snomed: '55822004'})
    MERGE (ckd:Condition {name: 'CKD Stage 3', icd10: 'N18.3', snomed: '70796007'})
    MERGE (htn:Condition {name: 'Hypertension', icd10: 'I10', snomed: '38341003'})
    MERGE (dm2:Condition {name: 'Type 2 Diabetes', icd10: 'E11.9', snomed: '44054006'})
    MERGE (hf:Condition {name: 'Heart Failure', icd10: 'I50.9', snomed: '84114007'})
    """)

    # Seed Biological Pathways
    graph.query("""
    MERGE (p1:BiologicalPathway {name: 'Dual Hemostatic Inhibition (VKORC1 + COX-1 Platelet Aggregation)'})
    MERGE (p2:BiologicalPathway {name: 'Efferent Arteriole Constriction + Distal Tubular K+ Retention'})
    MERGE (p3:BiologicalPathway {name: 'Renin-Angiotensin-Aldosterone System (RAAS) Overactivation'})
    MERGE (p4:BiologicalPathway {name: 'CYP3A4 Metabolic Competition'})
    """)

    # Seed Clinical Risks
    graph.query("""
    MERGE (r1:ClinicalRisk {name: 'Major Systemic & Intracranial Hemorrhage', severity: 'CRITICAL'})
    MERGE (r2:ClinicalRisk {name: 'Severe Hyperkalemia & Acute Kidney Injury (AKI)', severity: 'CRITICAL'})
    MERGE (r3:ClinicalRisk {name: 'Hypotensive Crisis & Syncope', severity: 'HIGH'})
    MERGE (r4:ClinicalRisk {name: 'Lactic Acidosis', severity: 'HIGH'})
    MERGE (r5:ClinicalRisk {name: 'Thromboembolism', severity: 'HIGH'})
    """)

    # Seed Safe Alternatives
    graph.query("""
    MERGE (alt1:Alternative {name: 'Acetaminophen (Paracetamol) or Low-Dose Aspirin 81mg + Pantoprazole 40mg', rationale: 'Bypasses COX-1 mucosal toxicity or shields gastric mucosa'})
    MERGE (alt2:Alternative {name: 'Hold Ibuprofen & Monitor Serum Potassium (K+) + Creatinine in 24h', rationale: 'Prevents acute eGFR drop and hyperkalemic arrhythmia'})
    MERGE (alt3:Alternative {name: 'Reduce Lisinopril dose + Hold Spironolactone temporarily', rationale: 'Minimizes RAAS overactivation and K+ retention'})
    MERGE (alt4:Alternative {name: 'Switch to Non-CYP3A4 statin (Pravastatin or Rosuvastatin)', rationale: 'Avoids metabolic competition with other CYP3A4 substrates'})
    MERGE (alt5:Alternative {name: 'Not specified', rationale: 'Default alternative when none specified'})
    """)

    # Seed Hospital Protocols owned by specialists
    graph.query("""
    MERGE (d1:Doctor {name: 'Dr. Sarah Jenkins, MD', dept: 'Cardiology'})
    MERGE (d2:Doctor {name: 'Dr. Rajeev Menon, MD', dept: 'Nephrology'})
    MERGE (d3:Doctor {name: 'Dr. Emily Chen, MD', dept: 'Endocrinology'})
    MERGE (d4:Doctor {name: 'Dr. Michael Torres, MD', dept: 'Emergency Medicine'})

    MERGE (proto1:Protocol {name: 'Anticoagulation Reconciliation Protocol', dept: 'Cardiology'})
    MERGE (proto2:Protocol {name: 'Renal Medication Adjustment Protocol', dept: 'Nephrology'})
    MERGE (proto3:Protocol {name: 'Diabetes Medication Safety Protocol', dept: 'Endocrinology'})
    MERGE (proto4:Protocol {name: 'Emergency Triage Protocol', dept: 'Emergency Medicine'})

    MERGE (d1)-[:OWNS_PROTOCOL]->(proto1)
    MERGE (d2)-[:OWNS_PROTOCOL]->(proto2)
    MERGE (d3)-[:OWNS_PROTOCOL]->(proto3)
    MERGE (d4)-[:OWNS_PROTOCOL]->(proto4)
    """)

    # Create relationships: Drug-Drug Interactions
    graph.query("""
    MERGE (w:Medication {name: 'Warfarin'})-[:INTERACTS_WITH]->(a:Medication {name: 'Aspirin'})
    MERGE (w)-[:INTERACTS_WITH]->(clo:Medication {name: 'Clopidogrel'})
    MERGE (li:Medication {name: 'Lisinopril'})-[:INTERACTS_WITH]->(ib:Medication {name: 'Ibuprofen'})
    MERGE (sp:Medication {name: 'Spironolactone'})-[:INTERACTS_WITH]->(ib)
    MERGE (li)-[:INTERACTS_WITH]->(sp)
    MERGE (met:Medication {name: 'Metformin'})-[:INTERACTS_WITH]->(furo:Medication {name: 'Furosemide'})
    MERGE (dig:Medication {name: 'Digoxin'})-[:INTERACTS_WITH]->(furo)
    """)

    # Create relationships: Pathways trigger Risks
    graph.query("""
    MERGE (p1:BiologicalPathway {name: 'Dual Hemostatic Inhibition (VKORC1 + COX-1 Platelet Aggregation)'})-[:CAUSES_RISK]->(r1:ClinicalRisk {name: 'Major Systemic & Intracranial Hemorrhage'})
    MERGE (p2:BiologicalPathway {name: 'Efferent Arteriole Constriction + Distal Tubular K+ Retention'})-[:CAUSES_RISK]->(r2:ClinicalRisk {name: 'Severe Hyperkalemia & Acute Kidney Injury (AKI)'})
    MERGE (p3:BiologicalPathway {name: 'Renin-Angiotensin-Aldosterone System (RAAS) Overactivation'})-[:CAUSES_RISK]->(r3:ClinicalRisk {name: 'Hypotensive Crisis & Syncope'})
    MERGE (p4:BiologicalPathway {name: 'CYP3A4 Metabolic Competition'})-[:CAUSES_RISK]->(r5:ClinicalRisk {name: 'Thromboembolism'})
    """)

    # Create relationships: Risks recommend Alternatives
    graph.query("""
    MERGE (r1:ClinicalRisk {name: 'Major Systemic & Intracranial Hemorrhage'})-[:RECOMMENDED_ALTERNATIVE]->(alt1:Alternative {name: 'Acetaminophen (Paracetamol) or Low-Dose Aspirin 81mg + Pantoprazole 40mg'})
    MERGE (r2:ClinicalRisk {name: 'Severe Hyperkalemia & Acute Kidney Injury (AKI)'})-[:RECOMMENDED_ALTERNATIVE]->(alt2:Alternative {name: 'Hold Ibuprofen & Monitor Serum Potassium (K+) + Creatinine in 24h'})
    MERGE (r3:ClinicalRisk {name: 'Hypotensive Crisis & Syncope'})-[:RECOMMENDED_ALTERNATIVE]->(alt3:Alternative {name: 'Reduce Lisinopril dose + Hold Spironolactone temporarily'})
    MERGE (r5:ClinicalRisk {name: 'Thromboembolism'})-[:RECOMMENDED_ALTERNATIVE]->(alt4:Alternative {name: 'Switch to Non-CYP3A4 statin (Pravastatin or Rosuvastatin)'})
    MERGE (r4:ClinicalRisk {name: 'Lactic Acidosis'})-[:RECOMMENDED_ALTERNATIVE]->(alt5:Alternative {name: 'Not specified'})
    """)

    # Create relationships: Risks escalate to Specialists
    graph.query("""
    MERGE (r1:ClinicalRisk {name: 'Major Systemic & Intracranial Hemorrhage'})-[:ESCALATE_TO]->(d1:Doctor {name: 'Dr. Sarah Jenkins, MD'})
    MERGE (r2:ClinicalRisk {name: 'Severe Hyperkalemia & Acute Kidney Injury (AKI)'})-[:ESCALATE_TO]->(d2:Doctor {name: 'Dr. Rajeev Menon, MD'})
    MERGE (r3:ClinicalRisk {name: 'Hypotensive Crisis & Syncope'})-[:ESCALATE_TO]->(d1)
    MERGE (r4:ClinicalRisk {name: 'Lactic Acidosis'})-[:ESCALATE_TO]->(d3:Doctor {name: 'Dr. Emily Chen, MD'})
    MERGE (r5:ClinicalRisk {name: 'Thromboembolism'})-[:ESCALATE_TO]->(d1)
    """)

    # Create relationships: Drugs trigger Pathways
    graph.query("""
    MERGE (a:Medication {name: 'Aspirin'})-[:TRIGGERS_PATHWAY]->(p1:BiologicalPathway {name: 'Dual Hemostatic Inhibition (VKORC1 + COX-1 Platelet Aggregation)'})
    MERGE (clo:Medication {name: 'Clopidogrel'})-[:TRIGGERS_PATHWAY]->(p1)
    MERGE (ib:Medication {name: 'Ibuprofen'})-[:TRIGGERS_PATHWAY]->(p2:BiologicalPathway {name: 'Efferent Arteriole Constriction + Distal Tubular K+ Retention'})
    MERGE (li:Medication {name: 'Lisinopril'})-[:TRIGGERS_PATHWAY]->(p3:BiologicalPathway {name: 'Renin-Angiotensin-Aldosterone System (RAAS) Overactivation'})
    MERGE (sp:Medication {name: 'Spironolactone'})-[:TRIGGERS_PATHWAY]->(p3)
    """)

    print("✅ Layer 1: Medical Ontology Bootstrap completed successfully")


if __name__ == "__main__":
    bootstrap_medical_ontology()
