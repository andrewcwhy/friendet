import { createServerFileRoute } from '@tanstack/solid-start/server'
import { json } from '@tanstack/solid-start'
import { neo4jService } from '../../services/neo4j'

export const ServerRoute = createServerFileRoute('/api/test-neo4j')
  .methods({
    GET: async () => {
      try {
        console.log('Testing Neo4j connection...')
        
        // Test connection
        const isConnected = await neo4jService.testConnection()
        if (!isConnected) {
          return json({ error: 'Failed to connect to Neo4j' }, { status: 500 })
        }

        // Get all people
        const people = await neo4jService.getAllPeople()
        console.log('Found people:', people.length)

        return json({
          success: true,
          message: 'Neo4j connection successful',
          peopleCount: people.length,
          people: people.slice(0, 5), // Return first 5 people
        })

      } catch (error: any) {
        console.error('Neo4j test error:', error)
        return json({
          error: 'Neo4j test failed',
          details: error.message
        }, { status: 500 })
      }
    },

    POST: async ({ request }) => {
      try {
        const body = await request.json()
        const { name, age, location, info, occupation } = body

        if (!name) {
          return json({ error: 'Name is required' }, { status: 400 })
        }

        // Add person to database
        const success = await neo4jService.addPerson({
          name,
          age: age ? parseInt(age) : undefined,
          location,
          info,
          occupation
        })

        if (success) {
          return json({
            success: true,
            message: `Added ${name} to the database`
          })
        } else {
          return json({
            error: 'Failed to add person to database'
          }, { status: 500 })
        }

      } catch (error: any) {
        console.error('Add person error:', error)
        return json({
          error: 'Failed to add person',
          details: error.message
        }, { status: 500 })
      }
    }
  }) 