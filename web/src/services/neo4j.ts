import neo4j, { Driver, Session } from 'neo4j-driver'

class Neo4jService {
  private driver: Driver
  private dbName: string

  constructor() {
    this.driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password')
    )
    this.dbName = 'data'
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.driver.verifyConnectivity()
      return true
    } catch (error) {
      console.error('Neo4j connection failed:', error)
      return false
    }
  }

  private getSession(): Session {
    return this.driver.session({ database: this.dbName })
  }

  // Read operations
  async getAllPeople(): Promise<any[]> {
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

  async getPersonByName(name: string): Promise<any | null> {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (p:Person {name: $name})
        RETURN p.name as name, p.age as age, p.location as location,
               p.birthday as birthday, p.info as info, p.occupation as occupation
      `, { name })
      
      if (result.records.length === 0) return null
      
      const record = result.records[0]
      return {
        name: record.get('name'),
        age: record.get('age'),
        location: record.get('location'),
        birthday: record.get('birthday'),
        info: record.get('info'),
        occupation: record.get('occupation')
      }
    } finally {
      await session.close()
    }
  }

  async getRelationships(personName?: string): Promise<any[]> {
    const session = this.getSession()
    try {
      let query = `
        MATCH (p1:Person)-[r]->(p2:Person)
        RETURN p1.name as person1, type(r) as relationship, p2.name as person2,
               r.since as since, r.description as description
      `
      let params = {}
      
      if (personName) {
        query = `
          MATCH (p1:Person {name: $name})-[r]->(p2:Person)
          RETURN p1.name as person1, type(r) as relationship, p2.name as person2,
                 r.since as since, r.description as description
          UNION
          MATCH (p1:Person)-[r]->(p2:Person {name: $name})
          RETURN p1.name as person1, type(r) as relationship, p2.name as person2,
                 r.since as since, r.description as description
        `
        params = { name: personName }
      }
      
      const result = await session.run(query, params)
      return result.records.map(record => ({
        person1: record.get('person1'),
        relationship: record.get('relationship'),
        person2: record.get('person2'),
        since: record.get('since'),
        description: record.get('description')
      }))
    } finally {
      await session.close()
    }
  }

  // Write operations
  async addPerson(personData: {
    name: string
    age?: number
    location?: string
    birthday?: string
    info?: string
    occupation?: string
  }): Promise<boolean> {
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

  async updatePerson(name: string, updates: {
    age?: number
    location?: string
    birthday?: string
    info?: string
    occupation?: string
  }): Promise<boolean> {
    const session = this.getSession()
    try {
      const setClause = Object.keys(updates)
        .map(key => `p.${key} = $${key}`)
        .join(', ')
      
      await session.run(`
        MATCH (p:Person {name: $name})
        SET ${setClause}, p.updated = datetime()
      `, { name, ...updates })
      return true
    } catch (error) {
      console.error('Error updating person:', error)
      return false
    } finally {
      await session.close()
    }
  }

  async addRelationship(
    person1: string,
    person2: string,
    relationshipType: string,
    properties?: { since?: string; description?: string }
  ): Promise<boolean> {
    const session = this.getSession()
    try {
      await session.run(`
        MATCH (p1:Person {name: $person1}), (p2:Person {name: $person2})
        CREATE (p1)-[r:${relationshipType} {
          since: $since,
          description: $description,
          created: datetime()
        }]->(p2)
      `, {
        person1,
        person2,
        since: properties?.since,
        description: properties?.description
      })
      return true
    } catch (error) {
      console.error('Error adding relationship:', error)
      return false
    } finally {
      await session.close()
    }
  }

  async deletePerson(name: string): Promise<boolean> {
    const session = this.getSession()
    try {
      await session.run(`
        MATCH (p:Person {name: $name})
        DETACH DELETE p
      `, { name })
      return true
    } catch (error) {
      console.error('Error deleting person:', error)
      return false
    } finally {
      await session.close()
    }
  }

  async deleteRelationship(
    person1: string,
    person2: string,
    relationshipType?: string
  ): Promise<boolean> {
    const session = this.getSession()
    try {
      let query = `
        MATCH (p1:Person {name: $person1})-[r]->(p2:Person {name: $person2})
        DELETE r
      `
      
      if (relationshipType) {
        query = `
          MATCH (p1:Person {name: $person1})-[r:${relationshipType}]->(p2:Person {name: $person2})
          DELETE r
        `
      }
      
      await session.run(query, { person1, person2 })
      return true
    } catch (error) {
      console.error('Error deleting relationship:', error)
      return false
    } finally {
      await session.close()
    }
  }

  // Search operations
  async searchPeople(query: string): Promise<any[]> {
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

  async close(): Promise<void> {
    await this.driver.close()
  }
}

export const neo4jService = new Neo4jService() 