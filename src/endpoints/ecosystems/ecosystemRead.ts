import { D1ReadEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { EcosystemModel } from "./base";

export class EcosystemRead extends D1ReadEndpoint<HandleArgs> {
	_meta = {
		model: EcosystemModel,
	};
}
