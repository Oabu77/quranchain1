import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MinecraftBackups extends OpenAPIRoute {
public schema = {
tags: ["Minecraft"],
summary: "List Minecraft world backups with multi-field filtering and size analysis",
description:
"Queries the D1 backup registry for Minecraft world snapshots. Supports 4-dimensional " +
"filtering: by server_id (qcmesh1/qcmesh2), date prefix, backup label, and hardware class. " +
"Returns human-readable file sizes and mesh replication status. Ordered by newest first. " +
"Total size across all matching backups is computed for capacity planning.",
operationId: "minecraft-backups-list",
request: {
query: z.object({
server_id: z.string().optional().describe("Filter by server (qcmesh1 or qcmesh2)"),
date: z.string().optional().describe("Filter by date prefix (e.g. 2025-01)"),
label: z.string().optional().describe("Filter by backup label"),
hardware: z.string().optional().describe("Filter by hardware class"),
}),
},
responses: {
"200": {
description: "Filtered backup list with size analysis and replication status",
...contentJson(
z.object({
success: z.literal(true),
total: z.number(),
total_size_bytes: z.number(),
total_size_human: z.string(),
filters_applied: z.record(z.string()),
backups: z.array(
z.object({
id: z.number(),
server_id: z.string(),
filename: z.string(),
label: z.string(),
size_bytes: z.number(),
size_human: z.string(),
hardware: z.string(),
mesh_replicated: z.boolean(),
created_at: z.string(),
}),
),
execution_ms: z.number(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const db = c.env.DB;
const data = await this.getValidatedData<typeof this.schema>();
const query = data.query;

const conditions: string[] = [];
const params: string[] = [];

if (query.server_id) {
conditions.push("server_id = ?");
params.push(query.server_id);
}
if (query.date) {
conditions.push("created_at LIKE ?");
params.push(`${query.date}%`);
}
if (query.label) {
conditions.push("label = ?");
params.push(query.label);
}
if (query.hardware) {
conditions.push("hardware = ?");
params.push(query.hardware);
}

const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
const sql = `SELECT * FROM minecraft_backups ${where} ORDER BY created_at DESC`;

const stmt = db.prepare(sql);
const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

let totalSizeBytes = 0;
const backups = result.results.map((b: Record<string, unknown>) => {
const sizeBytes = b.size_bytes as number;
totalSizeBytes += sizeBytes;
return {
...b,
size_human: this.formatBytes(sizeBytes),
mesh_replicated: Boolean(b.mesh_replicated),
};
});

const filtersApplied: Record<string, string> = {};
if (query.server_id) filtersApplied.server_id = query.server_id;
if (query.date) filtersApplied.date = query.date;
if (query.label) filtersApplied.label = query.label;
if (query.hardware) filtersApplied.hardware = query.hardware;

return {
success: true as const,
total: backups.length,
total_size_bytes: totalSizeBytes,
total_size_human: this.formatBytes(totalSizeBytes),
filters_applied: filtersApplied,
backups,
execution_ms: Date.now() - started,
};
}

private formatBytes(bytes: number): string {
if (bytes === 0) return "0 B";
const k = 1024;
const sizes = ["B", "KB", "MB", "GB", "TB"];
const i = Math.floor(Math.log(bytes) / Math.log(k));
return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
}
