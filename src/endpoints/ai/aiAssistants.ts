import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

/**
 * 12 GPT-4o assistants — embedded roster.
 * No upstream fetch required; ai.darcloud.host is a landing page, not an API.
 */
const AI_ASSISTANTS: Array<{ name: string; model: string; description: string }> = [
	{ name: "Quran Scholar", model: "gpt-4o", description: "Quranic text analysis, tafsir, and cross-reference engine" },
	{ name: "Hadith Verifier", model: "gpt-4o", description: "Isnad chain verification and hadith grading" },
	{ name: "Arabic Linguist", model: "gpt-4o", description: "Classical Arabic morphology and semantic analysis" },
	{ name: "DarLaw Legal Advisor", model: "gpt-4o", description: "IP filings, trademark strategy, and compliance" },
	{ name: "Infrastructure DevOps", model: "gpt-4o", description: "Cloud infrastructure, CI/CD, and mesh orchestration" },
	{ name: "Revenue Strategist", model: "gpt-4o", description: "SaaS pricing, subscription optimization, and forecasting" },
	{ name: "Sharia Compliance", model: "gpt-4o", description: "Islamic finance rules and halal certification" },
	{ name: "Education Tutor", model: "gpt-4o", description: "Adaptive learning paths for Quranic education" },
	{ name: "Security Auditor", model: "gpt-4o", description: "Code review, vulnerability scanning, and pen-test guidance" },
	{ name: "Data Analyst", model: "gpt-4o", description: "D1 analytics, query optimization, and reporting" },
	{ name: "Content Creator", model: "gpt-4o", description: "Marketing copy, blog posts, and social media content" },
	{ name: "Customer Support", model: "gpt-4o", description: "Tier-1 support triage, FAQ, and escalation routing" },
];

export { AI_ASSISTANTS };

export class AIAssistants extends OpenAPIRoute {
	public schema = {
		tags: ["AI Workers"],
		summary: "List all 12 OpenAI GPT-4o assistants with their specializations and capabilities",
		description:
			"Returns the full assistant roster. Each assistant is a fine-tuned GPT-4o instance " +
			"with a specific domain expertise (e.g. Quranic scholarship, infrastructure DevOps, " +
			"revenue optimization).",
		operationId: "ai-assistants-list",
		responses: {
			"200": {
				description: "Full assistant roster with model and capability metadata",
				...contentJson(
					z.object({
						success: z.literal(true),
						total: z.number().describe("Number of registered assistants"),
						models_used: z.record(z.string(), z.number()).describe("Count of assistants per model version"),
						assistants: z.array(
							z.object({
								name: z.string(),
								model: z.string().describe("OpenAI model ID (e.g. gpt-4o)"),
								description: z.string().optional().describe("Assistant specialization summary"),
							}),
						),
						source: z.string(),
						execution_ms: z.number(),
						fetched_at: z.string(),
					}),
				),
			},
		},
	};

	public async handle(_c: AppContext) {
		const started = Date.now();

		const models_used: Record<string, number> = {};
		for (const a of AI_ASSISTANTS) {
			models_used[a.model] = (models_used[a.model] || 0) + 1;
		}

		return {
			success: true as const,
			total: AI_ASSISTANTS.length,
			models_used,
			assistants: AI_ASSISTANTS,
			source: "darcloud-assistant-registry",
			execution_ms: Date.now() - started,
			fetched_at: new Date().toISOString(),
		};
	}
}
