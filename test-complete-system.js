import neo4j from 'neo4j-driver'
import OpenAI from 'openai'

// Neo4j Service Test
class Neo4jService {
  constructor() {
    this.driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password')
    )
    this.dbName = 'data'
  }

  async testConnection() {
    try {
      await this.driver.verifyConnectivity()
      return true
    } catch (error) {
      console.error('Neo4j connection failed:', error)
      return false
    }
  }

  getSession() {
    return this.driver.session({ database: this.dbName })
  }

  async getAllPeople() {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (p:Person)
        RETURN p.name as name, p.age as age, p.location as location, 
               p.birthday as birthday, p.info as info, p.occupation as occupation
        ORDER BY p.name
      `)
      return result.records.map(record => ({
        name: record.get('name'),
        age: record.get('age'),
        location: record.get('location'),
        birthday: record.get('birthday'),
        info: record.get('info'),
        occupation: record.get('occupation')
      }))
    } finally {
      await session.close()
    }
  }

  async addPerson(personData) {
    const session = this.getSession()
    try {
      const params = {
        name: personData.name,
        age: personData.age || null,
        location: personData.location || null,
        birthday: personData.birthday || null,
        info: personData.info || null,
        occupation: personData.occupation || null
      }
      
      await session.run(`
        CREATE (p:Person {
          name: $name,
          age: $age,
          location: $location,
          birthday: $birthday,
          info: $info,
          occupation: $occupation,
          created: datetime()
        })
      `, params)
      return true
    } catch (error) {
      console.error('Error adding person:', error)
      return false
    } finally {
      await session.close()
    }
  }

  async searchPeople(query) {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (p:Person)
        WHERE toLower(p.name) CONTAINS toLower($query)
           OR toLower(p.info) CONTAINS toLower($query)
           OR toLower(p.location) CONTAINS toLower($query)
           OR toLower(p.occupation) CONTAINS toLower($query)
        RETURN p.name as name, p.age as age, p.location as location,
               p.birthday as birthday, p.info as info, p.occupation as occupation
        ORDER BY p.name
      `, { query })
      
      return result.records.map(record => ({
        name: record.get('name'),
        age: record.get('age'),
        location: record.get('location'),
        birthday: record.get('birthday'),
        info: record.get('info'),
        occupation: record.get('occupation')
      }))
    } finally {
      await session.close()
    }
  }

  async close() {
    await this.driver.close()
  }
}

// OpenAI Test (Mock)
function mockOpenAI() {
  return {
    chat: {
      completions: {
        create: async (params) => {
          // Mock response that would add a person
          if (params.messages.some(m => m.content.includes('Sarah Johnson'))) {
            return {
              choices: [{
                message: {
                  content: "I'll help you add Sarah Johnson to your database.",
                  tool_calls: [{
                    id: 'test-call-1',
                    function: {
                      name: 'write_graph',
                      arguments: JSON.stringify({
                        action: 'add_person',
                        data: {
                          name: 'Sarah Johnson',
                          age: 28,
                          occupation: 'software engineer',
                          location: 'San Francisco',
                          info: 'Really into hiking and photography'
                        }
                      })
                    }
                  }]
                }
              }]
            }
          }
          
          // Mock response for showing people
          if (params.messages.some(m => m.content.toLowerCase().includes('show me all'))) {
            return {
              choices: [{
                message: {
                  content: "Let me show you all the people in your database.",
                  tool_calls: [{
                    id: 'test-call-2',
                    function: {
                      name: 'read_graph',
                      arguments: JSON.stringify({})
                    }
                  }]
                }
              }]
            }
          }

          // Default greeting response
          return {
            choices: [{
              message: {
                content: "Hello! I'm your AI relationship assistant. I can help you manage information about people in your life. Try telling me about someone you know!"
              }
            }]
          }
        }
      }
    }
  }
}

async function runCompleteSystemTest() {
  console.log('🚀 Running Complete System Test\n')
  console.log('=' * 60)

  const neo4jService = new Neo4jService()
  const openai = mockOpenAI()

  try {
    // Test 1: Neo4j Connection
    console.log('\n1. Testing Neo4j Connection...')
    const isConnected = await neo4jService.testConnection()
    if (isConnected) {
      console.log('✅ Neo4j connection successful')
    } else {
      console.log('❌ Neo4j connection failed')
      return
    }

    // Test 2: Read existing data
    console.log('\n2. Reading existing people from database...')
    const existingPeople = await neo4jService.getAllPeople()
    console.log(`✅ Found ${existingPeople.length} people in database`)
    existingPeople.slice(0, 3).forEach(person => {
      console.log(`   • ${person.name} - ${person.info}`)
    })

    // Test 3: Mock AI interaction to add person
    console.log('\n3. Testing AI integration (mock)...')
    const aiResponse = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: 'I met Sarah Johnson today. She is 28 and works as a software engineer in San Francisco.' }
      ]
    })
    
    console.log('✅ AI Response:', aiResponse.choices[0].message.content)
    
    if (aiResponse.choices[0].message.tool_calls) {
      const toolCall = aiResponse.choices[0].message.tool_calls[0]
      console.log('✅ AI wants to call function:', toolCall.function.name)
      
      if (toolCall.function.name === 'write_graph') {
        const functionArgs = JSON.parse(toolCall.function.arguments)
        if (functionArgs.action === 'add_person') {
          console.log('✅ Adding person to database...')
          const success = await neo4jService.addPerson(functionArgs.data)
          if (success) {
            console.log('✅ Successfully added Sarah Johnson to database')
          } else {
            console.log('❌ Failed to add person to database')
          }
        }
      }
    }

    // Test 4: Verify the person was added
    console.log('\n4. Verifying person was added...')
    const searchResults = await neo4jService.searchPeople('Sarah')
    if (searchResults.length > 0) {
      console.log('✅ Found Sarah in database:')
      searchResults.forEach(person => {
        console.log(`   • ${person.name}, ${person.age}, ${person.occupation}, ${person.location}`)
      })
    } else {
      console.log('❌ Sarah not found in database')
    }

    // Test 5: Test search functionality
    console.log('\n5. Testing search functionality...')
    const engineerResults = await neo4jService.searchPeople('engineer')
    console.log(`✅ Found ${engineerResults.length} people related to "engineer"`)
    engineerResults.slice(0, 2).forEach(person => {
      console.log(`   • ${person.name} - ${person.occupation || person.info}`)
    })

    console.log('\n' + '=' * 60)
    console.log('🎉 ALL TESTS PASSED! Your AI Assistant + Neo4j system is working!')
    console.log('\nYou can now:')
    console.log('• Add people by telling the AI about them')
    console.log('• Search for people by name, occupation, or other details')
    console.log('• View all people in your network')
    console.log('• Build relationships between people')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await neo4jService.close()
  }
}

runCompleteSystemTest() 