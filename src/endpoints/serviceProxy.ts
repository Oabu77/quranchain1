import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";

export class ServiceProxyEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["Service Proxy"],
		summary: "Proxy requests to the main service",
		request: {
			params: z.object({
				path: z.string().describe("The path to proxy to the main service"),
			}),
		},
		responses: {
			"200": {
				description: "Successful response from the main service",
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

		// Proxy the request to the main service
		const mainServiceResponse = await c.env.MAIN_SERVICE.fetch(
			new Request(`http://main-service/${data.params.path}`, {
				method: c.req.method,
				headers: c.req.raw.headers,
			}),
		);

		return mainServiceResponse;
	}
}
