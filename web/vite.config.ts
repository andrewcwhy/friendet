import tailwindCSS from "@tailwindcss/vite";
import { tanstackStart } from '@tanstack/solid-start/plugin/vite'
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		tanstackStart({}),
		solid(),
		tailwindCSS(),
		tsconfigPaths(),
	],
	server: {
		port: 9705,
	},
});
