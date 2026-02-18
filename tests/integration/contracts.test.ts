import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Contracts and DarLaw API Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── Companies ──
	describe("GET /api/contracts/companies", () => {
		it("should return companies list", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/companies");
			const body = await res.json<{
				success: boolean;
				companies: any[];
				total: number;
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(Array.isArray(body.companies)).toBe(true);
			expect(body.total).toBeGreaterThanOrEqual(0);
		});
	});

	// ── Seed Companies ──
	describe("POST /api/contracts/companies/seed", () => {
		it("should seed all 101 companies", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/companies/seed", {
				method: "POST",
			});
			const body = await res.json<{
				success: boolean;
				total_companies: number;
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.total_companies).toBeGreaterThanOrEqual(101);
		});
	});

	// ── Seed Contracts ──
	describe("POST /api/contracts/seed-all", () => {
		it("should seed contracts after companies", async () => {
			// Ensure companies exist first
			await SELF.fetch("http://local.test/api/contracts/companies/seed", {
				method: "POST",
			});

			const res = await SELF.fetch("http://local.test/api/contracts/seed-all", {
				method: "POST",
			});
			const body = await res.json<{
				success: boolean;
				summary: { total_contracts: number };
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.summary.total_contracts).toBeGreaterThanOrEqual(0);
		});
	});

	// ── List Contracts ──
	describe("GET /api/contracts", () => {
		it("should return contracts list", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts");
			const body = await res.json<{
				success: boolean;
				contracts: any[];
				total: number;
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(Array.isArray(body.contracts)).toBe(true);
		});
	});

	// ── Revenue ──
	describe("GET /api/contracts/revenue", () => {
		it("should return revenue breakdown", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/revenue");
			const body = await res.json<{
				success: boolean;
				totals: { monthly: string };
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.totals.monthly).toBeTruthy();
		});
	});

	// ── DarLaw ──
	describe("GET /api/contracts/darlaw/agents", () => {
		it("should return DarLaw agents list", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/darlaw/agents");
			const body = await res.json<{
				success: boolean;
				agents: any[];
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.agents.length).toBe(11);
		});
	});

	// ── Legal Filings ──
	describe("POST /api/contracts/legal/file-all", () => {
		it("should seed legal filings", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/legal/file-all", {
				method: "POST",
			});
			const body = await res.json<{
				success: boolean;
				summary: { total_filings: number };
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.summary.total_filings).toBeGreaterThanOrEqual(0);
		});
	});

	describe("GET /api/contracts/legal/filings", () => {
		it("should return legal filings list", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/legal/filings");
			const body = await res.json<{
				success: boolean;
				filings: any[];
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(Array.isArray(body.filings)).toBe(true);
		});
	});

	// ── IP Portfolio ──
	describe("POST /api/contracts/legal/protect-ip", () => {
		it("should seed IP portfolio", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/legal/protect-ip", {
				method: "POST",
			});
			const body = await res.json<{
				success: boolean;
				summary: { total_protections: number };
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.summary.total_protections).toBeGreaterThanOrEqual(0);
		});
	});

	describe("GET /api/contracts/legal/ip", () => {
		it("should return IP protections list", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/legal/ip");
			const body = await res.json<{
				success: boolean;
				ip_protections: any[];
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(Array.isArray(body.ip_protections)).toBe(true);
		});
	});

	// ── Bootstrap All ──
	describe("POST /api/contracts/bootstrap", () => {
		it("should bootstrap entire ecosystem", async () => {
			const res = await SELF.fetch("http://local.test/api/contracts/bootstrap", {
				method: "POST",
			});
			const body = await res.json<{
				success: boolean;
				results: {
					companies_registered: number;
					contracts_signed: number;
					legal_filings: number;
					ip_protections: number;
				};
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.results.companies_registered).toBeGreaterThanOrEqual(0);
			expect(body.results.contracts_signed).toBeGreaterThanOrEqual(0);
		});
	});

	// ── OrDar Law Migration ──
	describe("OrDar Law to DarLaw Migration", () => {
		it("should not have any ordar-law companies after seeding", async () => {
			// Bootstrap to create tables and seed data
			await SELF.fetch("http://local.test/api/contracts/bootstrap", {
				method: "POST",
			});

			const res = await SELF.fetch("http://local.test/api/contracts/companies");
			const body = await res.json<{
				success: boolean;
				companies: Array<{ company_id: string; name: string }>;
			}>();

			expect(res.status).toBe(200);
			const ordarLaw = body.companies.filter(
				(c) => c.company_id === "ordar-law",
			);
			expect(ordarLaw).toHaveLength(0);

			// Should have darlaw instead
			const darlaw = body.companies.filter(
				(c) => c.company_id === "darlaw",
			);
			expect(darlaw.length).toBeGreaterThanOrEqual(1);
		});
	});
});
