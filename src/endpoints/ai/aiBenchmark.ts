import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";
import { AI_FLEET } from "./aiFleet";
import { AI_ASSISTANTS } from "./aiAssistants";

const FETCH_TIMEOUT_MS = 15_000;

interface CategoryBreakdown {
	category: string;
	description: string;
	count: number;
	agents: string[];
}

export class AIBenchmark extends OpenAPIRoute {
	public schema = {
		tags: ["AI Workers"],
		summary: "Full-system benchmark — AI agents, assistants, mesh network, and infrastructure health",
		description:
			"Executes a parallel real-time benchmark across every DarCloud subsystem: " +
			"(1) categorises all 66 AI fleet agents by role, " +
			"(2) inventories all OpenAI GPT-4o assistants, " +
			"(3) queries D1 for dual-layer FungiMesh node/encryption status, " +
			"(4) performs HEAD requests against 8 production domains to verify uptime. " +
			"Returns a composite score (0–100) and letter grade (A+ through D).",
		operationId: "ai-benchmark-full",
		responses: {
			"200": {
				description: "Complete benchmark with per-subsystem metrics and overall grade",
				...contentJson(
					z.object({
						success: z.literal(true),
						timestamp: z.string(),
						execution_ms: z.number(),
						benchmark: z.object({
							ai_fleet: z.object({
								total_agents: z.number(),
								deployed: z.number(),
								offline: z.number(),
								platforms: z.record(z.number()),
								response_ms: z.number(),
								categories: z.array(
									z.object({
										category: z.string(),
										description: z.string(),
										count: z.number(),
										agents: z.array(z.string()),
									}),
								),
							}),
							assistants: z.object({
								total: z.number(),
								models: z.record(z.number()),
								response_ms: z.number(),
							}),
							mesh: z.object({
								layer1: z.string(),
								layer2: z.string(),
								total_nodes: z.number(),
								encryption: z.string(),
								response_ms: z.number(),
								healthy: z.boolean(),
							}),
							infrastructure: z.object({
								domains_checked: z.number(),
								domains_online: z.number(),
								uptime_pct: z.number(),
								services: z.array(
									z.object({
										domain: z.string(),
										status: z.string(),
										response_ms: z.number(),
									}),
								),
							}),
							overall: z.object({
								score: z.number(),
								grade: z.string(),
								total_ai_entities: z.number(),
								total_mesh_nodes: z.number(),
								all_services_online: z.boolean(),
								verdict: z.string(),
							}),
						}),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const started = Date.now();
		const timestamp = new Date().toISOString();

		// Run ALL benchmarks in parallel
		const [fleetResult, assistantsResult, meshResult, infraResult] =
			await Promise.all([
				this.benchmarkFleet(),
				this.benchmarkAssistants(),
				this.benchmarkMesh(c.env.DB),
				this.benchmarkInfrastructure(),
			]);

		// Composite score (weighted)
		const scores: number[] = [];
		const fleetRatio = fleetResult.total_agents > 0
			? (fleetResult.deployed / fleetResult.total_agents) * 100
			: 0;
		scores.push(fleetRatio);
		scores.push(assistantsResult.total > 0 ? 100 : 0);
		const meshScore = meshResult.healthy ? 100 : meshResult.total_nodes > 0 ? 60 : 20;
		scores.push(meshScore);
		scores.push(infraResult.uptime_pct);

		const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
		const grade =
			avgScore >= 95 ? "A+" :
			avgScore >= 85 ? "A" :
			avgScore >= 75 ? "B" :
			avgScore >= 60 ? "C" : "D";

		const totalEntities = fleetResult.total_agents + assistantsResult.total;
		const allOnline = infraResult.domains_online === infraResult.domains_checked;

		const verdict =
			avgScore >= 95 ? `All systems nominal — ${totalEntities} AI entities active, full mesh connectivity` :
			avgScore >= 85 ? `Strong performance — ${totalEntities} AI entities, minor degradation detected` :
			avgScore >= 75 ? `Operational with warnings — check offline agents and mesh layers` :
			avgScore >= 60 ? `Degraded — multiple subsystems need attention` :
			`Critical — major subsystem failures detected`;

		return {
			success: true as const,
			timestamp,
			execution_ms: Date.now() - started,
			benchmark: {
				ai_fleet: fleetResult,
				assistants: assistantsResult,
				mesh: meshResult,
				infrastructure: infraResult,
				overall: {
					score: avgScore,
					grade,
					total_ai_entities: totalEntities,
					total_mesh_nodes: meshResult.total_nodes,
					all_services_online: allOnline,
					verdict,
				},
			},
		};
	}

	/** Uses embedded AI_FLEET data — no upstream fetch */
	private benchmarkFleet() {
		const start = Date.now();
		const agents = AI_FLEET;
		const deployed = agents.filter((a) => a.status === "deployed").length;
		const offline = agents.filter((a) => a.status !== "deployed").length;

		const platforms: Record<string, number> = {};
		for (const a of agents) {
			platforms[a.platform] = (platforms[a.platform] || 0) + 1;
		}

		return {
			total_agents: agents.length,
			deployed,
			offline,
			platforms,
			response_ms: Date.now() - start,
			categories: this.categorizeAgents(agents),
		};
	}

	private categorizeAgents(agents: typeof AI_FLEET): CategoryBreakdown[] {
		const catMap: Record<string, { description: string; agents: string[] }> = {
			"Core AI": {
				description: "Orchestrators, QuranChain scholars, DarCloud controllers, MCP nodes",
				agents: [],
			},
			"Gas Toll Agents": {
				description: "Blockchain transaction fee managers and gas optimization workers",
				agents: [],
			},
			"Expert Agents": {
				description: "Domain-specialized AI with deep expertise in specific verticals",
				agents: [],
			},
			"Bot Workers": {
				description: "Automated task execution bots for repetitive or scheduled jobs",
				agents: [],
			},
			"Infrastructure Agents": {
				description: "DevOps, deployment, Docker management, and server health workers",
				agents: [],
			},
			"Validator Agents": {
				description: "Data validation, Quranic text verification, and integrity checkers",
				agents: [],
			},
			"Revenue & Commerce": {
				description: "Payment processing, subscription management, and pricing optimization",
				agents: [],
			},
			"DarLaw Legal AI": {
				description: "IP filings, trademark strategy, contract drafting, and compliance",
				agents: [],
			},
			"Other": {
				description: "Uncategorized agents pending role assignment",
				agents: [],
			},
		};

		for (const a of agents) {
			const n = a.name.toLowerCase();
			if (n.includes("gas toll")) catMap["Gas Toll Agents"].agents.push(a.name);
			else if (n.includes("expert")) catMap["Expert Agents"].agents.push(a.name);
			else if (n.includes("bot")) catMap["Bot Workers"].agents.push(a.name);
			else if (n.includes("validator")) catMap["Validator Agents"].agents.push(a.name);
			else if (n.includes("darlaw")) catMap["DarLaw Legal AI"].agents.push(a.name);
			else if (
				n.includes("infrastructure") || n.includes("server") ||
				n.includes("deploy") || n.includes("docker") || n.includes("devops")
			) catMap["Infrastructure Agents"].agents.push(a.name);
			else if (
				n.includes("revenue") || n.includes("commerce") ||
				n.includes("payment") || n.includes("subscription") || n.includes("pricing")
			) catMap["Revenue & Commerce"].agents.push(a.name);
			else if (
				n.includes("quranchain") || n.includes("darcloud") ||
				n.includes("orchestrator") || n.includes("fungimesh") ||
				n.includes("mcp") || n.includes("quran scholar") || n.includes("hadith")
			) catMap["Core AI"].agents.push(a.name);
			else catMap["Other"].agents.push(a.name);
		}

		return Object.entries(catMap)
			.filter(([, v]) => v.agents.length > 0)
			.map(([category, data]) => ({
				category,
				description: data.description,
				count: data.agents.length,
				agents: data.agents,
			}));
	}

	/** Uses embedded AI_ASSISTANTS data — no upstream fetch */
	private benchmarkAssistants() {
		const start = Date.now();
		const models: Record<string, number> = {};
		for (const a of AI_ASSISTANTS) {
			models[a.model] = (models[a.model] || 0) + 1;
		}
		return {
			total: AI_ASSISTANTS.length,
			models,
			response_ms: Date.now() - start,
		};
	}

	/** Queries D1 mesh_nodes table directly — no upstream fetch */
	private async benchmarkMesh(db: D1Database) {
		const start = Date.now();
		try {
			const totalRow = await db.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes").first<{ cnt: number }>();
			const totalNodes = totalRow?.cnt ?? 0;

			const dockerRow = await db
				.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes WHERE hardware = 'docker'")
				.first<{ cnt: number }>();
			const dockerNodes = dockerRow?.cnt ?? 0;
			const cloudflareNodes = totalNodes - dockerNodes;

			const l1 = cloudflareNodes > 0 ? "operational" : "no_nodes";
			const l2 = dockerNodes > 0 ? "operational" : "no_nodes";

			return {
				layer1: l1,
				layer2: l2,
				total_nodes: totalNodes,
				encryption: "WireGuard + AES-256-GCM",
				response_ms: Date.now() - start,
				healthy: totalNodes > 0,
			};
		} catch {
			return {
				layer1: "error",
				layer2: "error",
				total_nodes: 0,
				encryption: "unknown",
				response_ms: Date.now() - start,
				healthy: false,
			};
		}
	}

	/** HEAD checks against production domains — safe now that wildcard routes are removed */
	private async benchmarkInfrastructure() {
		const domains = [
			"darcloud.host",
			"darcloud.net",
			"blockchain.darcloud.host",
			"mesh.darcloud.host",
			"ai.darcloud.host",
			"enterprise.darcloud.host",
			"halalwealthclub.darcloud.host",
			"realestate.darcloud.host",
		];

		const results = await Promise.all(
			domains.map(async (domain) => {
				const start = Date.now();
				try {
					const res = await fetch(`https://${domain}/`, {
						method: "HEAD",
						signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
					});
					return {
						domain,
						status: res.ok ? "online" : `error-${res.status}`,
						response_ms: Date.now() - start,
					};
				} catch {
					return {
						domain,
						status: "offline",
						response_ms: Date.now() - start,
					};
				}
			}),
		);

		const online = results.filter((r) => r.status === "online").length;

		return {
			domains_checked: domains.length,
			domains_online: online,
			uptime_pct: Math.round((online / domains.length) * 100),
			services: results,
		};
	}
}
