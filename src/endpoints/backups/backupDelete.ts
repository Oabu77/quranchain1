import { D1DeleteEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupDelete extends D1DeleteEndpoint<HandleArgs> {
	_meta = {
		model: BackupModel,
	};
}
