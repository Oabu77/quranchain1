import { D1ReadEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupRead extends D1ReadEndpoint<HandleArgs> {
	_meta = {
		model: BackupModel,
	};
}
