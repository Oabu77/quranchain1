import { D1UpdateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { EcosystemModel } from "./base";

export class EcosystemUpdate extends D1UpdateEndpoint<HandleArgs> {
	_meta = {
		model: EcosystemModel,
		fields: EcosystemModel.schema.pick({
			// this is purposely missing the id, because users shouldn't be able to modify it
			// created_at is also omitted to maintain data integrity (timestamps should be immutable)
			name: true,
			slug: true,
			description: true,
			category: true,
			status: true,
		}),
	};
}
