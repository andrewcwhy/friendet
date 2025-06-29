import { createServerFileRoute } from '@tanstack/solid-start/server'
import { json } from '@tanstack/solid-start'
import { handleConversation } from '../../openaiapi.js'

export const ServerRoute = createServerFileRoute('/api/ai-chat')
  .methods({
    POST: async ({ request }) => {
      try {
        const body = await request.json()
        const { message, conversationHistory = [] } = body

        if (!message) {
          return json({ error: 'Message is required' }, { status: 400 })
        }

        console.log('API received message:', message)
        
        // Use our working AI assistant
        const response = await handleConversation(message, conversationHistory)
        
        if (response.error) {
          return json(response, { status: 500 })
        }

        return json(response)

      } catch (error: any) {
        console.error('AI Chat API error:', error)
        return json({ 
          error: 'Failed to process chat request',
          details: error.message 
        }, { status: 500 })
      }
    }
  }) 