import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, onMount } from 'solid-js'

import ChatBox, { type Message } from '../components/ChatBox' // Import Message type

export const Route = createFileRoute('/chat')({
    component: Chat,
})

const agentRequestFlow = async (messages: Message[]) => {}

function Chat() {
    // 1. The state is now managed here, in the parent component.
    const [messages, setMessages] = createSignal<Message[]>([]);

    // 2. Example: Add a message from the route component when it loads.
    onMount(() => {
        setMessages([
            ...messages(),
            {
                id: Date.now(),
                text: "Welcome to the chat! I'm a message sent from the main route component.",
                fromUser: false,
            }
        ]);
    });

    // 3. Pass the state getter and setter down to the ChatBox component.
    return <ChatBox messages={messages} setMessages={setMessages} />;
}