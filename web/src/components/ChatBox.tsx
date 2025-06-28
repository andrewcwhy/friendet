import { createSignal, createEffect, For, type Component, Accessor, Setter } from "solid-js";
import Input from "./Input";

export interface Message {
    id: number;
    text: string;
    fromUser: boolean;
}

interface ChatBoxProps {
    messages: Accessor<Message[]>;
    setMessages: Setter<Message[]>;
}

const ChatBox: Component<ChatBoxProps> = (props) => {
    const [inputValue, setInputValue] = createSignal("");
    let containerRef: HTMLDivElement | undefined;

    // Auto-scroll on new messages
    // This effect now correctly depends on props.messages
    createEffect(() => {
        props.messages(); // Depend on messages
        const el = containerRef;
        if (el) {
            requestAnimationFrame(() =>
                el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
            );
        }
    });


    const sendMessage = () => {
        const text = inputValue().trim();
        if (!text) return;

        // Use the setter from props
        props.setMessages((prev) => [...prev, { id: Date.now(), text, fromUser: true }]);
        setInputValue("");

        // 🚧 Replace with real API call
        setTimeout(() => {
            // Use the setter from props
            props.setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, text: `Echo: ${text}`, fromUser: false },
            ]);
        }, 500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div class="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
            {/* Message list */}
            <div
                ref={containerRef!}
                class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-800"
            >
                <For each={props.messages()} fallback={
                    <div class="text-center text-gray-500">
                        Start the conversation
                    </div>
                }>
                    {(msg) => (
                        <div
                            class={`flex max-w-[75%] px-4 py-2 rounded-2xl whitespace-pre-wrap ${msg.fromUser
                                ? "self-end bg-indigo-600 text-white"
                                : "self-start bg-gray-700 text-gray-200 border border-gray-600"
                                }`}
                        >
                            {msg.text}
                        </div>
                    )}
                </For>
            </div>

            {/* Input area */}
            <div class="p-4 border-t border-gray-700 flex items-center space-x-3 bg-gray-900">
                <Input
                    placeholder="Type your message…"
                    value={inputValue()}
                    onInput={(e) =>
                        setInputValue((e.target as HTMLInputElement).value)
                    }
                    onKeyDown={handleKeyDown as any}
                    class="flex-1"
                />
                <button
                    type="button"
                    onClick={sendMessage}
                    class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-400 text-white rounded-full transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatBox;