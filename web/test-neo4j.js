import neo4j from 'neo4j-driver'

async function testNeo4j() {
  const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'password')
  )

  try {
    await driver.verifyConnectivity()
    console.log('✅ Connected to Neo4j!')

    const session = driver.session({ database: 'data' })
    
    // Test reading people
    const result = await session.run(`
      MATCH (p:Person)
      RETURN p.name as name, p.age as age, p.location as location, 
             p.birthday as birthday, p.info as info, p.occupation as occupation
      ORDER BY p.name
      LIMIT 5
    `)
    
    console.log('\n👥 People in database:')
    result.records.forEach(record => {
      console.log(`  • ${record.get('name')} - ${record.get('info')}`)
    })

    await session.close()
    console.log('\n✅ Neo4j service test completed successfully!')
    
  } catch (error) {
    console.error('❌ Neo4j test failed:', error)
  } finally {
    await driver.close()
  }
}

testNeo4j() 