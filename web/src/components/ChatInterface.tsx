import { createSignal, For, Show } from 'solid-js'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = createSignal<Message[]>([])
  const [inputMessage, setInputMessage] = createSignal('')
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal('')

  const sendMessage = async () => {
    const message = inputMessage().trim()
    if (!message || isLoading()) return

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: messages().map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (err: any) {
      setError(`Failed to send message: ${err.message}`)
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError('')
  }

  return (
    <div class="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800">AI Relationship Assistant</h2>
        <button
          onClick={clearChat}
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <Show when={messages().length === 0}>
          <div class="text-center text-gray-500 py-8">
            <div class="text-lg mb-2">👋 Hello!</div>
            <p>I'm your AI assistant for managing relationships and people in your life.</p>
            <p class="text-sm mt-2">Try saying something like:</p>
            <ul class="text-sm mt-2 space-y-1 text-left max-w-md mx-auto">
              <li>• "I met Sarah today, she's 28 and works as a teacher"</li>
              <li>• "Show me all my friends"</li>
              <li>• "What do you know about John?"</li>
            </ul>
          </div>
        </Show>

        <For each={messages()}>
          {(message) => (
            <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div class={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p class="whitespace-pre-wrap">{message.content}</p>
                <p class={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </For>

        <Show when={isLoading()}>
          <div class="flex justify-start">
            <div class="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* Error Display */}
      <Show when={error()}>
        <div class="px-4 py-2 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error()}
        </div>
      </Show>

      {/* Input */}
      <div class="p-4 border-t border-gray-200">
        <div class="flex space-x-2">
          <textarea
            value={inputMessage()}
            onInput={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about someone or ask about your relationships..."
            class="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
            disabled={isLoading()}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage().trim() || isLoading()}
            class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
} 