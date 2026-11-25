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
				homeEn: resolve(root, "en/index.html"),
				homeEs: resolve(root, "es/index.html"),
				meetingConfirmed: resolve(root, "en/meeting-confirmed/index.html"),
				meetingConfirmedEs: resolve(root, "es/meeting-confirmed/index.html"),
				bookMeetingEn: resolve(root, "en/book-meeting/index.html"),
				bookMeetingEs: resolve(root, "es/book-meeting/index.html"),
			},
		},
	},
	publicDir: "public",
	server: {
		port: 3100,
	},
});
