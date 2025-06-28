import { Outlet, createRootRoute } from "@tanstack/solid-router";
import { Suspense } from "solid-js";

import Footer from "~/components/Footer";
import NavBar from "~/components/NavBar";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<>
			<NavBar />
			<Suspense>
				<Outlet />
			</Suspense>
			<Footer />
		</>
	);
}
