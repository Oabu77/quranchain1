import { z } from "zod";

export const ecosystem = z.object({
	id: z.number().int(),
	name: z.string(),
	slug: z.string(),
	description: z.string(),
	category: z.enum([
		"validator",
		"node",
		"application",
		"community",
		"infrastructure",
	]),
	status: z.enum(["active", "inactive", "pending"]),
	created_at: z.string().datetime(),
});

export const EcosystemModel = {
	tableName: "ecosystems",
	primaryKeys: ["id"],
	schema: ecosystem,
	serializer: (obj: Record<string, string | number | boolean>) => {
		return obj;
	},
	serializerObject: ecosystem,
};
