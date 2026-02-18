import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MinecraftServerStatus extends OpenAPIRoute {
public schema = {
tags: ["Minecraft"],
summary: "Get detailed status for a specific Minecraft server with backup analytics",
description:
"Retrieves comprehensive status for a single Minecraft server (qcmesh1 or qcmesh2). " +
"Includes full server specs (host, port, version, player count, hardware), plus a " +
"backup summary with total count, latest backup timestamp, and aggregate storage size. " +
"Use this to monitor individual server health and backup coverage.",
operationId: "minecraft-server-status",
request: {
params: z.object({
serverId: z.string().describe("Server ID (qcmesh1 or qcmesh2)"),
}),
},
responses: {
"200": {
description: "Server details with backup analytics",
...contentJson(
z.object({
success: z.literal(true),
server: z.object({
id: z.string(),
name: z.string(),
host: z.string().nullable(),
port: z.number(),
version: z.string().nullable(),
status: z.string(),
players_online: z.number(),
max_players: z.number(),
hardware: z.string().nullable(),
}),
backup_summary: z.object({
total_backups: z.number(),
latest_backup: z.string().nullable(),
total_size_bytes: z.number(),
total_size_human: z.string(),
mesh_replicated: z.number().describe("Number of backups replicated to mesh"),
}),
execution_ms: z.number(),
}),
),
},
"404": {
description: "Server not found",
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
const data = await this.getValidatedData<typeof this.schema>();
const { serverId } = data.params;
const db = c.env.DB;

const server = await db
.prepare("SELECT * FROM minecraft_servers WHERE id = ?")
.bind(serverId)
.first();

if (!server) {
return c.json(
{
success: false as const,
error: `Server '${serverId}' not found`,
hint: "Valid server IDs: qcmesh1, qcmesh2. Use GET /minecraft/servers to list all.",
},
404,
);
}

const backupStats = await db
.prepare(
`SELECT COUNT(*) as total, MAX(created_at) as latest,
        COALESCE(SUM(size_bytes), 0) as total_size,
        COALESCE(SUM(mesh_replicated), 0) as replicated
 FROM minecraft_backups WHERE server_id = ?`,
)
.bind(serverId)
.first();

const totalSize = Number(backupStats?.total_size || 0);

return {
success: true as const,
server,
backup_summary: {
total_backups: Number(backupStats?.total || 0),
latest_backup: (backupStats?.latest as string) || null,
total_size_bytes: totalSize,
total_size_human: this.formatBytes(totalSize),
mesh_replicated: Number(backupStats?.replicated || 0),
},
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
