import path from "node:path";
import {
	cloudflareTest,
	readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const migrationsPath = path.join(import.meta.dirname, "..", "migrations");
const migrations = await readD1Migrations(migrationsPath);

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: {
				configPath: path.join(import.meta.dirname, "..", "wrangler.jsonc"),
			},
			miniflare: {
				d1Databases: ["DB"],
				bindings: {
					MIGRATIONS: migrations,
				},
			},
		}),
	],
	test: {
		setupFiles: ["./tests/apply-migrations.ts"],
	},
});
