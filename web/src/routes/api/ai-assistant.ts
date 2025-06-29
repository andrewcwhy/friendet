import { createServerFileRoute } from '@tanstack/solid-start/server'
import { json } from '@tanstack/solid-start'
import OpenAI from 'openai'
import { neo4jService } from '../../services/neo4j'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: "https://us-mco-omnibus-1-ollama--provider-1--xlam.athena.u0026.net/v1/",
})

const systemPrompt = `You are a helpful assistant that helps users remember important details about their close friends and family members by storing and retrieving information about them in a graph database. You can add, update, retrieve, and delete information about people, their relationships, and their attributes.

You have access to tools for managing the Neo4j graph database. When users mention people or relationships, you should store this information in the graph database.

Guidelines:
- Always ask for the user's name to identify them
- If asked about a person/relationship that doesn't exist, suggest adding them
- For updates/deletes, check if the person/relationship exists first
- For additions, check if similar people already exist to avoid duplicates
- Be conversational and helpful, focusing on relationship management`

export const ServerRoute = createServerFileRoute('/api/ai-assistant')
  .methods({
    POST: async ({ request }) => {
      try {
        const body = await request.json()
        const { message, conversationHistory = [] } = body

        if (!message) {
          return json({ error: 'Message is required' }, { status: 400 })
        }

        // Build conversation messages
        const messages = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ]

        // Call OpenAI with function calling
        const response = await openai.chat.completions.create({
          model: "hf.co/Salesforce/Llama-xLAM-2-8b-fc-r-gguf:Q4_K_S",
          messages: messages as any,
          tools: [
            {
              type: "function",
              function: {
                name: "read_graph",
                description: "Read information from the graph database",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "What to search for (optional - if empty, returns all people)"
                    }
                  }
                }
              }
            },
            {
              type: "function",
              function: {
                name: "write_graph",
                description: "Write to the graph database",
                parameters: {
                  type: "object",
                  properties: {
                    action: {
                      type: "string",
                      enum: ["add_person", "update_person", "delete_person", "add_relationship", "delete_relationship"],
                      description: "The action to perform"
                    },
                    data: {
                      type: "object",
                      description: "The data for the action"
                    }
                  },
                  required: ["action", "data"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "search_graph",
                description: "Search the graph database for specific information",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query"
                    }
                  },
                  required: ["query"]
                }
              }
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        })

        const assistantMessage = response.choices[0].message
        let finalResponse = assistantMessage.content || ''

        // Handle function calls
        if (assistantMessage.tool_calls) {
          const functionResults = []
          
          for (const toolCall of assistantMessage.tool_calls) {
            const functionName = toolCall.function.name
            const functionArgs = JSON.parse(toolCall.function.arguments)
            
            let result
            
            try {
              switch (functionName) {
                case 'read_graph':
                  if (functionArgs.query) {
                    result = await neo4jService.searchPeople(functionArgs.query)
                  } else {
                    result = await neo4jService.getAllPeople()
                  }
                  break
                  
                case 'search_graph':
                  result = await neo4jService.searchPeople(functionArgs.query)
                  break
                  
                case 'write_graph':
                  result = await handleWriteGraph(functionArgs.action, functionArgs.data)
                  break
                  
                default:
                  result = { error: `Unknown function: ${functionName}` }
              }
            } catch (error: any) {
              result = { error: `Function execution failed: ${error.message}` }
            }
            
            functionResults.push({
              tool_call_id: toolCall.id,
              result: JSON.stringify(result)
            })
          }

          // Get final response with function results
          const followUpResponse = await openai.chat.completions.create({
            model: "hf.co/Salesforce/Llama-xLAM-2-8b-fc-r-gguf:Q4_K_S",
            messages: [
              ...messages,
              assistantMessage,
              ...functionResults.map(fr => ({
                role: 'tool' as const,
                tool_call_id: fr.tool_call_id,
                content: fr.result
              }))
            ] as any,
            max_tokens: 500,
            temperature: 0.7,
          })

          finalResponse = followUpResponse.choices[0].message.content || finalResponse
        }

        return json({
          message: finalResponse,
          conversationHistory: [
            ...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: finalResponse }
          ]
        })

      } catch (error: any) {
        console.error('AI Assistant error:', error)
        return json({ 
          error: 'Failed to process request',
          details: error.message 
        }, { status: 500 })
      }
    }
  })

async function handleWriteGraph(action: string, data: any) {
  switch (action) {
    case 'add_person':
      return await neo4jService.addPerson(data)
      
    case 'update_person':
      const { name, ...updates } = data
      return await neo4jService.updatePerson(name, updates)
      
    case 'delete_person':
      return await neo4jService.deletePerson(data.name)
      
    case 'add_relationship':
      return await neo4jService.addRelationship(
        data.person1,
        data.person2,
        data.relationshipType,
        { since: data.since, description: data.description }
      )
      
    case 'delete_relationship':
      return await neo4jService.deleteRelationship(
        data.person1,
        data.person2,
        data.relationshipType
      )
      
    default:
      throw new Error(`Unknown action: ${action}`)
  }
} 