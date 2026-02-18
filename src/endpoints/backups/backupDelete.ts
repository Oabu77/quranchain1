import { D1DeleteEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupDelete extends D1DeleteEndpoint<HandleArgs> {
_meta = {
model: BackupModel,
summary: "Permanently delete a backup record from the registry",
description:
"Removes the backup metadata from D1. Note: this only deletes the registry record — " +
"the actual backup file on disk or in object storage must be cleaned up separately. " +
"This action cannot be undone.",
operationId: "backup-delete",
tags: ["Backups"],
};
}
