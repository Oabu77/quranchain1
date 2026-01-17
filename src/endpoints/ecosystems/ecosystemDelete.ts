import { D1DeleteEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { EcosystemModel } from "./base";

export class EcosystemDelete extends D1DeleteEndpoint<HandleArgs> {
	_meta = {
		model: EcosystemModel,
	};
}
