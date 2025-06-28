import type { Component } from "solid-js";

const Input: Component<{
  type?: string;
  placeholder?: string;
  value?: string;
  onInput?: (e: Event) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  class?: string;
}> = (props) => {
  return (
    <input
      type={props.type || "text"}
      placeholder={props.placeholder}
      value={props.value}
      onInput={props.onInput}
      onKeyDown={props.onKeyDown}
      class={`w-full px-4 py-2 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${props.class}`}
    />
  );
};

export default Input;
