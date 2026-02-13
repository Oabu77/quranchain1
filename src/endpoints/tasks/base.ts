// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

import { z } from "zod";

export const task = z.object({
	id: z.number().int(),
	name: z.string(),
	slug: z.string(),
	description: z.string(),
	completed: z.boolean(),
	due_date: z.string().datetime(),
});

export const TaskModel = {
	tableName: "tasks",
	primaryKeys: ["id"],
	schema: task,
	serializer: (obj: object) => {
		// Type guard to ensure obj has the expected structure
		const record = obj as Record<string, unknown>;
		return {
			...record,
			completed: Boolean(record.completed),
		};
	},
	serializerObject: task,
};
