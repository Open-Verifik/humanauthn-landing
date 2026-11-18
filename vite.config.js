import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	build: {
		outDir: "dist",
		assetsDir: "assets",
		rollupOptions: {
			input: {
				main: resolve(root, "index.html"),
				meetingConfirmed: resolve(root, "en/meeting-confirmed/index.html"),
			},
		},
	},
	publicDir: "public",
	server: {
		port: 3100,
	},
});
