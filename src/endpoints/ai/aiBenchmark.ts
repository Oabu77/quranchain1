import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const AI_UPSTREAM = "https://ai.darcloud.host";
const MESH_UPSTREAM = "https://mesh.darcloud.host";

interface AgentEntry {
	id: number;
	name: string;
	status: string;
	platform: string;
}

interface AssistantEntry {
	name: string;
	model: string;
	description?: string;
}

interface MeshData {
	layer1_nodejs: { status: string };
	layer2_python: { status: string };
	summary: {
		total_nodes: number;
		encryption: string;
		continents: number;
	};
}

interface CategoryBreakdown {
	category: string;
	count: number;
	agents: string[];
}

export class AIBenchmark extends OpenAPIRoute {
	public schema = {
		tags: ["AI Workers"],
		summary:
			"Benchmark all AI agents, assistants, and mesh infrastructure — full system health check",
		operationId: "ai-benchmark",
		responses: {
			"200": {
				description: "Complete benchmark results across all DarCloud AI services",
				...contentJson(
					z.object({
						success: z.boolean(),
						timestamp: z.string(),
						benchmark: z.object({
							ai_fleet: z.object({
								total_agents: z.number(),
								deployed: z.number(),
								platforms: z.record(z.number()),
								response_ms: z.number(),
								categories: z.array(
									z.object({
										category: z.string(),
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
							}),
							infrastructure: z.object({
								domains_checked: z.number(),
								domains_online: z.number(),
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
							}),
						}),
					}),
				),
			},
		},
	};

	public async handle(_c: AppContext) {
		const timestamp = new Date().toISOString();

		// Run all benchmarks in parallel
		const [fleetResult, assistantsResult, meshResult, infraResult] =
			await Promise.all([
				this.benchmarkFleet(),
				this.benchmarkAssistants(),
				this.benchmarkMesh(),
				this.benchmarkInfrastructure(),
			]);

		// Calculate overall score
		const scores: number[] = [];
		if (fleetResult.total_agents > 0) scores.push(100);
		else scores.push(0);
		if (assistantsResult.total > 0) scores.push(100);
		else scores.push(0);
		if (meshResult.layer1 === "online" || meshResult.total_nodes > 0)
			scores.push(80);
		else scores.push(30);
		scores.push(
			(infraResult.domains_online / infraResult.domains_checked) * 100,
		);

		const avgScore = Math.round(
			scores.reduce((a, b) => a + b, 0) / scores.length,
		);
		const grade =
			avgScore >= 90
				? "A+"
				: avgScore >= 80
					? "A"
					: avgScore >= 70
						? "B"
						: avgScore >= 60
							? "C"
							: "D";

		return {
			success: true,
			timestamp,
			benchmark: {
				ai_fleet: fleetResult,
				assistants: assistantsResult,
				mesh: meshResult,
				infrastructure: infraResult,
				overall: {
					score: avgScore,
					grade,
					total_ai_entities: fleetResult.total_agents + assistantsResult.total,
					total_mesh_nodes: meshResult.total_nodes,
					all_services_online:
						infraResult.domains_online === infraResult.domains_checked,
				},
			},
		};
	}

	private async benchmarkFleet() {
		const start = Date.now();
		try {
			const res = await fetch(`${AI_UPSTREAM}/api/fleet`);
			const data = (await res.json()) as { fleet: AgentEntry[] };
			const elapsed = Date.now() - start;

			const agents = data.fleet || [];
			const deployed = agents.filter((a) => a.status === "deployed").length;

			// Count by platform
			const platforms: Record<string, number> = {};
			for (const a of agents) {
				platforms[a.platform] = (platforms[a.platform] || 0) + 1;
			}

			// Categorize agents
			const categories = this.categorizeAgents(agents);

			return {
				total_agents: agents.length,
				deployed,
				platforms,
				response_ms: elapsed,
				categories,
			};
		} catch {
			return {
				total_agents: 0,
				deployed: 0,
				platforms: {},
				response_ms: Date.now() - start,
				categories: [] as CategoryBreakdown[],
			};
		}
	}

	private categorizeAgents(agents: AgentEntry[]): CategoryBreakdown[] {
		const catMap: Record<string, string[]> = {
			"Core AI": [],
			"Gas Toll Agents": [],
			"Expert Agents": [],
			"Bot Workers": [],
			"Infrastructure Agents": [],
			"Validator Agents": [],
			"Revenue & Commerce": [],
			"Other": [],
		};

		for (const a of agents) {
			const n = a.name.toLowerCase();
			if (n.includes("gas toll") || n.includes("gas agent"))
				catMap["Gas Toll Agents"].push(a.name);
			else if (n.includes("expert")) catMap["Expert Agents"].push(a.name);
			else if (n.includes("bot")) catMap["Bot Workers"].push(a.name);
			else if (n.includes("validator")) catMap["Validator Agents"].push(a.name);
			else if (
				n.includes("infrastructure") ||
				n.includes("server") ||
				n.includes("deploy") ||
				n.includes("docker") ||
				n.includes("devops")
			)
				catMap["Infrastructure Agents"].push(a.name);
			else if (
				n.includes("revenue") ||
				n.includes("commerce") ||
				n.includes("payment") ||
				n.includes("subscription") ||
				n.includes("pricing")
			)
				catMap["Revenue & Commerce"].push(a.name);
			else if (
				n.includes("quranchain") ||
				n.includes("darcloud") ||
				n.includes("orchestrator") ||
				n.includes("fungimesh") ||
				n.includes("mcp") ||
				n.includes("quran scholar")
			)
				catMap["Core AI"].push(a.name);
			else catMap["Other"].push(a.name);
		}

		return Object.entries(catMap)
			.filter(([, v]) => v.length > 0)
			.map(([category, agents]) => ({
				category,
				count: agents.length,
				agents,
			}));
	}

	private async benchmarkAssistants() {
		const start = Date.now();
		try {
			const res = await fetch(`${AI_UPSTREAM}/api/assistants`);
			const data = (await res.json()) as {
				total: number;
				assistants: AssistantEntry[];
			};
			const elapsed = Date.now() - start;

			const models: Record<string, number> = {};
			for (const a of data.assistants || []) {
				models[a.model] = (models[a.model] || 0) + 1;
			}

			return {
				total: data.total || 0,
				models,
				response_ms: elapsed,
			};
		} catch {
			return {
				total: 0,
				models: {},
				response_ms: Date.now() - start,
			};
		}
	}

	private async benchmarkMesh() {
		const start = Date.now();
		try {
			const res = await fetch(`${MESH_UPSTREAM}/api/status`);
			const data = (await res.json()) as MeshData;
			const elapsed = Date.now() - start;

			return {
				layer1: data.layer1_nodejs?.status || "unknown",
				layer2: data.layer2_python?.status || "unknown",
				total_nodes: data.summary?.total_nodes || 0,
				encryption: data.summary?.encryption || "unknown",
				response_ms: elapsed,
			};
		} catch {
			return {
				layer1: "unreachable",
				layer2: "unreachable",
				total_nodes: 0,
				encryption: "unknown",
				response_ms: Date.now() - start,
			};
		}
	}

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
					const res = await fetch(`https://${domain}/`, { method: "HEAD" });
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

		return {
			domains_checked: domains.length,
			domains_online: results.filter((r) => r.status === "online").length,
			services: results,
		};
	}
}
