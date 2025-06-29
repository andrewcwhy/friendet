import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, onMount, For, Show } from 'solid-js'

interface Person {
  name: string
  age?: number
  location?: string
  birthday?: string
  info?: string
  occupation?: string
}

interface Relationship {
  person1: string
  relationship: string
  person2: string
  since?: string
  description?: string
}

export const Route = createFileRoute('/users')({
  component: PeopleComponent,
})

function PeopleComponent() {
  const [people, setPeople] = createSignal<Person[]>([])
  const [relationships, setRelationships] = createSignal<Relationship[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me all people and their relationships',
          conversationHistory: []
        })
      })

      if (!response.ok) {
        throw new Error('Failed to load data')
      }

      // For now, we'll just show a message that data loading is implemented
      // In a real implementation, we'd parse the AI response or call a dedicated API
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    loadData()
  })

  return (
    <div class="min-h-screen bg-gray-50 p-4">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-gray-900">People & Relationships</h1>
          <button
            onClick={loadData}
            disabled={loading()}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            {loading() ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <Show when={error()}>
          <div class="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error()}
          </div>
        </Show>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* People Section */}
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">People</h2>
            
            <Show when={people().length === 0 && !loading()}>
              <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-4">👥</div>
                <p>No people found in your database.</p>
                <p class="text-sm mt-2">Use the AI Assistant to add people to your network!</p>
              </div>
            </Show>

            <div class="space-y-4">
              <For each={people()}>
                {(person) => (
                  <div class="border border-gray-200 rounded-lg p-4">
                    <h3 class="font-semibold text-gray-900">{person.name}</h3>
                    <div class="mt-2 space-y-1 text-sm text-gray-600">
                      <Show when={person.age}>
                        <p>Age: {person.age}</p>
                      </Show>
                      <Show when={person.occupation}>
                        <p>Occupation: {person.occupation}</p>
                      </Show>
                      <Show when={person.location}>
                        <p>Location: {person.location}</p>
                      </Show>
                      <Show when={person.birthday}>
                        <p>Birthday: {person.birthday}</p>
                      </Show>
                      <Show when={person.info}>
                        <p class="mt-2">{person.info}</p>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Relationships Section */}
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Relationships</h2>
            
            <Show when={relationships().length === 0 && !loading()}>
              <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-4">🤝</div>
                <p>No relationships found in your database.</p>
                <p class="text-sm mt-2">Tell the AI Assistant about your relationships!</p>
              </div>
            </Show>

            <div class="space-y-4">
              <For each={relationships()}>
                {(rel) => (
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900">{rel.person1}</span>
                      <span class="text-gray-500">→</span>
                      <span class="text-blue-600 font-medium">{rel.relationship}</span>
                      <span class="text-gray-500">→</span>
                      <span class="font-medium text-gray-900">{rel.person2}</span>
                    </div>
                    <Show when={rel.since || rel.description}>
                      <div class="mt-2 text-sm text-gray-600">
                        <Show when={rel.since}>
                          <p>Since: {rel.since}</p>
                        </Show>
                        <Show when={rel.description}>
                          <p>{rel.description}</p>
                        </Show>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div class="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-blue-900 mb-2">How to use</h3>
          <ul class="text-blue-800 space-y-1">
            <li>• Go to the AI Assistant tab to add people and relationships</li>
            <li>• Say things like "I met John today, he's 30 and works as a developer"</li>
            <li>• Add relationships: "John is my colleague" or "Sarah is my friend"</li>
            <li>• Ask questions: "What do you know about John?" or "Show me all my friends"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
