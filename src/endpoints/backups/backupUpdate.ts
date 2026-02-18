import { D1UpdateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupUpdate extends D1UpdateEndpoint<HandleArgs> {
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
		summary: "Update a backup record — change status, label, or replication target",
		description:
			"Updates an existing backup's metadata. Common workflows: " +
			"(1) Update status from 'pending' to 'syncing' to 'completed' as backup progresses. " +
			"(2) Assign a mesh_node_id after replication. (3) Update file_hash after verification. " +
			"All fields are optional — only provided fields are updated.",
		operationId: "backup-update",
		tags: ["Backups"],
	};
}
