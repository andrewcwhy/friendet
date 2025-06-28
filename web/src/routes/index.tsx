import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<main>
			<header>
				<h1>Friendet</h1>
				<p>Welcome to Friendet. </p>
			</header>
		</main>
	);
}
