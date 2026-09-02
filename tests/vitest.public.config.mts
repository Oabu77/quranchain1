import path from "node:path";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

const migrationsPath = path.join(__dirname, "..", "migrations");
const migrations = await readD1Migrations(migrationsPath);

export default defineWorkersConfig({
  esbuild: {
    target: "esnext",
  },
  test: {
    include: ["tests/public/**/*.test.ts"],
    setupFiles: ["./tests/apply-migrations.ts"],
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: {
          configPath: "../wrangler.public.jsonc",
        },
        miniflare: {
          compatibilityFlags: ["experimental", "nodejs_compat"],
          bindings: {
            MIGRATIONS: migrations,
            JWT_SECRET: "test-only-public-jwt-secret-do-not-use-in-production",
            DARCLOUD_ADMIN_EMAILS: "admin@darcloud.host",
          },
        },
      },
    },
  },
});
