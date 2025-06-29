from neo4j import GraphDatabase

uri      = "bolt://localhost:7687"   
user     = "neo4j"
password = "password"       
db_name  = "data"                    

driver = GraphDatabase.driver(uri, auth=(user, password))
try:
    driver.verify_connectivity()
    print("✅ Connected to Neo4j!")
except Exception as e:
    print("❌ Connection failed:", e)
    driver.close()
    exit(1)

with driver.session() as session:
    print("\nDatabases:")
    for rec in session.run("SHOW DATABASES"):
        print(f" • {rec['name']} (status: {rec['currentStatus']})")

with driver.session(database=db_name) as session:
    labels = [r["label"] for r in session.run("CALL db.labels() YIELD label RETURN label")]
    print(f"\nLabels in '{db_name}': {labels}")


if "Person" in labels:
    with driver.session(database=db_name) as session:
        print("\n-- Person Nodes --")
        query = """
        MATCH (p:Person)
        RETURN p.name AS name, p.birthday AS birthday, p.info AS info
        ORDER BY p.name
        """
        for r in session.run(query):
            print(f" • {r['name']} – born {r['birthday']} – {r['info']}")
else:
    print("\nNo 'Person' label in this database.")


if "data" in labels:
    with driver.session(database=db_name) as session:
        print("\n-- Data Nodes --")
        for r in session.run("MATCH (n:data) RETURN n.data AS data LIMIT 25"):
            print(f" • {r['data']}")
else:
    print("\nNo 'data' label in this database.")

driver.close()

