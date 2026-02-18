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
summary: "Register a new backup file in the DarCloud backup registry",
description:
"Creates a new backup record with file metadata, hardware origin, and optional " +
"mesh node replication target. Set status to 'pending' initially, then update to " +
"'completed' after successful upload. File hash should be SHA-256 for integrity checks.",
operationId: "backup-create",
tags: ["Backups"],
};
}
