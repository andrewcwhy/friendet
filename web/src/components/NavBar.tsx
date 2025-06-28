import { Link } from "@tanstack/solid-router";
import type { Component } from "solid-js";

const links = [
	{
		to: "/",
		label: "Home",
	},
	{
		to: "/chat",
		label: "Chat",
	},
	{
		to: "/about",
		label: "About",
	},
];

const NavBar: Component = () => {
	return (
		<nav class="bg-gray-800 text-white p-4">
			<ul class="flex space-x-4">
				{links.map((link) => (
					<li>
						<Link to={link.to} class="text-white hover:text-gray-300">
							{link.label}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
};

export default NavBar;
