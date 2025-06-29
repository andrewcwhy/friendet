import { createFileRoute } from '@tanstack/solid-router'
import { ChatInterface } from '../components/ChatInterface'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div class="min-h-screen bg-gray-50 p-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">AI Relationship Assistant</h1>
          <p class="text-gray-600">Manage your personal relationships with the help of AI and Neo4j</p>
        </div>
        
        <div class="h-[600px]">
          <ChatInterface />
        </div>
        
        <div class="mt-8 text-center text-sm text-gray-500">
          <p>This assistant helps you remember details about friends, family, and colleagues.</p>
          <p>All information is stored securely in your local Neo4j database.</p>
        </div>
      </div>
    </div>
  )
}
