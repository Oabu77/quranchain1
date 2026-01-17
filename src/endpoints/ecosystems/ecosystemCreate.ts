import { D1CreateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { EcosystemModel } from "./base";

export class EcosystemCreate extends D1CreateEndpoint<HandleArgs> {
	_meta = {
		model: EcosystemModel,
		fields: EcosystemModel.schema.pick({
			// this is purposely missing the id, because users shouldn't be able to define it
			// created_at is also omitted so it is set automatically by the database
			name: true,
			slug: true,
			description: true,
			category: true,
			status: true,
		}),
	};
}
