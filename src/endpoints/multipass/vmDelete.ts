import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmDelete extends OpenAPIRoute {
public schema = {
tags: ["Multipass Fleet"],
summary: "Remove a Multipass VM from the fleet registry and generate teardown command",
description:
"Permanently deletes a VM record from the D1 fleet registry. Returns the exact " +
"'multipass delete --purge' command to run on the host to actually destroy the VM. " +
"This is a two-step process: (1) API removes the registry entry, (2) operator runs " +
"the teardown command on the physical host. Cannot be undone.",
operationId: "multipass-vm-delete",
request: {
params: z.object({
id: z.string().describe("VM identifier to permanently remove"),
}),
},
responses: {
"200": {
description: "VM removed from registry with host teardown instructions",
...contentJson(
z.object({
success: z.literal(true),
deleted: z.string(),
deleted_at: z.string(),
teardown_command: z.string().describe("Run this on the host to destroy the VM"),
execution_ms: z.number(),
}),
),
},
"404": {
description: "VM not found in the registry",
...contentJson(
z.object({
success: z.literal(false),
error: z.string(),
hint: z.string(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const db = c.env.DB;
const data = await this.getValidatedData<typeof this.schema>();
const { id } = data.params;

const vm = await db
.prepare("SELECT id, name FROM multipass_vms WHERE id = ?")
.bind(id)
.first();

if (!vm) {
return c.json(
{
success: false as const,
error: `VM '${id}' not found — may have already been deleted`,
hint: "Use GET /multipass/vms to list active VMs",
},
404,
);
}

await db.prepare("DELETE FROM multipass_vms WHERE id = ?").bind(id).run();

return {
success: true as const,
deleted: id,
deleted_at: new Date().toISOString(),
teardown_command: `multipass delete ${vm.name} --purge`,
execution_ms: Date.now() - started,
};
}
}
