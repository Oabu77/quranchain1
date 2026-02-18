import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmDelete extends OpenAPIRoute {
	public schema = {
		tags: ["Multipass"],
		summary: "Remove a Multipass VM from the fleet registry",
		operationId: "multipass-vm-delete",
		request: {
			params: z.object({
				id: z.string().describe("VM identifier to remove"),
			}),
		},
		responses: {
			"200": {
				description: "VM removed from registry",
				...contentJson(
					z.object({
						success: z.boolean(),
						deleted: z.string(),
						teardown_command: z.string(),
					}),
				),
			},
			"404": {
				description: "VM not found",
				...contentJson(
					z.object({ success: z.boolean(), error: z.string() }),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;
		const { id } = c.req.param() as { id: string };

		const vm = await db
			.prepare("SELECT id, name FROM multipass_vms WHERE id = ?")
			.bind(id)
			.first();

		if (!vm) {
			return c.json({ success: false, error: `VM '${id}' not found` }, 404);
		}

		await db.prepare("DELETE FROM multipass_vms WHERE id = ?").bind(id).run();

		return {
			success: true,
			deleted: id,
			teardown_command: `multipass delete ${vm.name} --purge`,
		};
	}
}
