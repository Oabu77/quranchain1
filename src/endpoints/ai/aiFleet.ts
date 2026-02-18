import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const AI_UPSTREAM = "https://ai.darcloud.host";

export class AIFleet extends OpenAPIRoute {
	public schema = {
		tags: ["AI Workers"],
		summary: "List all 66 AI agents deployed on DarCloud",
		operationId: "ai-fleet",
		responses: {
			"200": {
				description: "Full AI fleet inventory",
				...contentJson(
					z.object({
						success: z.boolean(),
						total: z.number(),
						fleet: z.array(
							z.object({
								id: z.number(),
								name: z.string(),
								status: z.string(),
								platform: z.string(),
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
			const res = await fetch(`${AI_UPSTREAM}/api/fleet`);
			const data = (await res.json()) as {
				fleet: Array<{
					id: number;
					name: string;
					status: string;
					platform: string;
				}>;
			};
			return {
				success: true,
				total: data.fleet.length,
				fleet: data.fleet,
				source: AI_UPSTREAM,
			};
		} catch (error) {
			return {
				success: false,
				total: 0,
				fleet: [],
				source: AI_UPSTREAM,
				error:
					error instanceof Error ? error.message : "Failed to reach AI fleet",
			};
		}
	}
}
