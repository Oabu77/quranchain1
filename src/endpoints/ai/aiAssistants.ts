import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const AI_UPSTREAM = "https://ai.darcloud.host";

export class AIAssistants extends OpenAPIRoute {
	public schema = {
		tags: ["AI Workers"],
		summary: "List all 12 OpenAI assistants (GPT-4o powered)",
		operationId: "ai-assistants",
		responses: {
			"200": {
				description: "OpenAI assistants inventory",
				...contentJson(
					z.object({
						success: z.boolean(),
						total: z.number(),
						assistants: z.array(
							z.object({
								name: z.string(),
								model: z.string(),
								description: z.string().optional(),
							}),
						),
						source: z.string(),
					}),
				),
			},
		},
	};

	public async handle(_c: AppContext) {
		try {
			const res = await fetch(`${AI_UPSTREAM}/api/assistants`);
			const data = (await res.json()) as {
				total: number;
				assistants: Array<{
					name: string;
					model: string;
					description?: string;
				}>;
			};
			return {
				success: true,
				total: data.total,
				assistants: data.assistants,
				source: AI_UPSTREAM,
			};
		} catch (error) {
			return {
				success: false,
				total: 0,
				assistants: [],
				source: AI_UPSTREAM,
				error:
					error instanceof Error
						? error.message
						: "Failed to reach assistants API",
			};
		}
	}
}
