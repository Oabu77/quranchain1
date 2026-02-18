import { z } from "zod";

export const backup = z.object({
	id: z.number().int(),
	filename: z.string(),
	label: z.string(),
	hardware: z.string(),
	file_hash: z.string().nullable(),
	size_bytes: z.number().int(),
	mesh_node_id: z.string().nullable(),
	status: z.enum(["pending", "syncing", "completed", "failed"]),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
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
