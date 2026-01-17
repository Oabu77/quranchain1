import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { EcosystemModel } from "./base";

export class EcosystemList extends D1ListEndpoint<HandleArgs> {
	_meta = {
		model: EcosystemModel,
	};

	searchFields = ["name", "slug", "description", "category", "status"];
	defaultOrderBy = "id DESC";
}
