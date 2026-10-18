from falkordb import FalkorDB

db = FalkorDB(host='localhost', port=6379)
graph = db.select_graph("test_hospital_graph")

# Run a simple Cypher query to create a test node and match it
graph.query("CREATE (d:Doctor {name: 'Dr. Sarah Jenkins', dept: 'Cardiology'})")
res = graph.query("MATCH (d:Doctor) RETURN d.name, d.dept")

for row in res.result_set:
    print(f"FalkorDB Node Found -> Doctor: {row[0]}, Dept: {row[1]}")