import type { Component } from "solid-js";

interface ButtonProps {
	label: string;
}

const Button: Component<ButtonProps> = (props) => {
	return <button type="button">{props.label}</button>;
};

export default Button;
