import { D1CreateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupCreate extends D1CreateEndpoint<HandleArgs> {
	_meta = {
		model: BackupModel,
		fields: BackupModel.schema.pick({
			filename: true,
			label: true,
			hardware: true,
			file_hash: true,
			size_bytes: true,
			mesh_node_id: true,
			status: true,
		}),
	};
}
