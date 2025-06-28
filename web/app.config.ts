import { defineConfig } from "@solidjs/start/config";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindCSS from "@tailwindcss/vite";

export default defineConfig({
	vite: {
		plugins: [
			tanstackRouter({ target: "solid"}),
			tailwindCSS,
		],
	},
});
