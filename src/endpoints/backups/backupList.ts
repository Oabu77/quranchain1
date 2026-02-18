import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupList extends D1ListEndpoint<HandleArgs> {
	_meta = {
		model: BackupModel,
	};

	searchFields = ["filename", "label", "hardware", "status"];
	defaultOrderBy = "created_at DESC";
}
