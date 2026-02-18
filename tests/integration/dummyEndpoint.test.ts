import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("System Health API Integration Tests", () => {
beforeEach(async () => {
vi.clearAllMocks();
});

describe("GET /health", () => {
it("should return system health status with component checks", async () => {
const response = await SELF.fetch("http://local.test/health");
const body = await response.json<{
success: boolean;
status: string;
version: string;
components: {
database: { status: string };
};
execution_ms: number;
}>();

expect(response.status).toBe(200);
expect(body.success).toBe(true);
expect(body.status).toMatch(/healthy|degraded|unhealthy/);
expect(body.version).toBe("5.3.0");
expect(body.components.database.status).toBe("up");
expect(body.execution_ms).toBeGreaterThanOrEqual(0);
});
});
});
