import { z } from "zod";

export const task = z.object({
id: z.number().int().describe("Auto-incremented task ID"),
name: z.string().describe("Task name — short actionable title"),
slug: z.string().describe("URL-friendly slug (e.g. deploy-mesh-relay)"),
description: z.string().describe("Detailed task description with acceptance criteria"),
completed: z.boolean().describe("Whether the task has been completed"),
due_date: z.string().datetime().describe("ISO 8601 deadline for task completion"),
});

export const TaskModel = {
tableName: "tasks",
primaryKeys: ["id"],
schema: task,
serializer: (obj: object) => {
const record = obj as Record<string, unknown>;
return {
...record,
completed: Boolean(record.completed),
};
},
serializerObject: task,
};
