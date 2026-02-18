import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MinecraftServers extends OpenAPIRoute {
public schema = {
tags: ["Minecraft"],
summary: "List all Minecraft servers (Qcmesh1, Qcmesh2) with player and backup statistics",
description:
"Queries the D1 registry for all registered Minecraft servers in the QuranChain mesh. " +
"Each server record includes host info, version, player counts, and hardware class. " +
"Also computes per-server backup statistics (count and latest backup date) via a join " +
"so you get a complete operational picture in one call.",
operationId: "minecraft-servers-list",
responses: {
"200": {
description: "All Minecraft servers with operational stats",
...contentJson(
z.object({
success: z.literal(true),
total: z.number(),
servers: z.array(
z.object({
id: z.string(),
name: z.string(),
host: z.string().nullable(),
port: z.number(),
version: z.string().nullable(),
status: z.string(),
players_online: z.number(),
max_players: z.number(),
hardware: z.string().nullable(),
backup_count: z.number(),
latest_backup: z.string().nullable(),
created_at: z.string(),
updated_at: z.string(),
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

// Get servers with backup stats in one efficient query
const serversResult = await db
.prepare("SELECT * FROM minecraft_servers ORDER BY name")
.all();

const servers = await Promise.all(
serversResult.results.map(async (server: Record<string, unknown>) => {
const backupStats = await db
.prepare(
"SELECT COUNT(*) as count, MAX(created_at) as latest FROM minecraft_backups WHERE server_id = ?",
)
.bind(server.id)
.first();

return {
...server,
backup_count: Number(backupStats?.count || 0),
latest_backup: (backupStats?.latest as string) || null,
};
}),
);

return {
success: true as const,
total: servers.length,
servers,
execution_ms: Date.now() - started,
};
}
}
