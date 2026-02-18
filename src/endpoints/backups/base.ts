import { z } from "zod";

export const backup = z.object({
id: z.number().int().describe("Auto-incremented backup ID"),
filename: z.string().describe("Backup filename (e.g. backup-2025-01-15.tar.gz)"),
label: z.string().describe("Human-readable label (e.g. daily-snapshot, pre-migration)"),
hardware: z.string().describe("Hardware class that produced the backup (leopard, standard)"),
file_hash: z.string().nullable().describe("SHA-256 hash for integrity verification"),
size_bytes: z.number().int().describe("Backup file size in bytes"),
mesh_node_id: z.string().nullable().describe("FungiMesh node ID where backup is replicated"),
status: z.enum(["pending", "syncing", "completed", "failed"]).describe("Backup lifecycle status"),
created_at: z.string().datetime().describe("When the backup was created"),
updated_at: z.string().datetime().describe("Last modification timestamp"),
});

export const BackupModel = {
tableName: "backups",
primaryKeys: ["id"],
schema: backup,
serializer: (obj: object) => {
return {
...(obj as Record<string, unknown>),
};
},
serializerObject: backup,
};
