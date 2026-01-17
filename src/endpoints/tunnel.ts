import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";

export class TunnelEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["Tunnel"],
		summary: "Connect to the tunnel service",
		request: {
			params: z.object({
				path: z.string().describe("The path to connect to via the tunnel"),
			}),
		},
		responses: {
			"200": {
				description: "Successful response from the tunnel",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							data: z.any(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const tunnelUrl = c.env.TUNNEL_URL;

		// Connect to the tunnel service
		const tunnelResponse = await fetch(`${tunnelUrl}/${data.params.path}`, {
			method: c.req.method,
			headers: c.req.raw.headers,
		});

		return tunnelResponse;
	}
}
