import { D1ReadEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupRead extends D1ReadEndpoint<HandleArgs> {
_meta = {
model: BackupModel,
summary: "Get a single backup record by ID with full metadata",
description:
"Retrieves the complete backup record including filename, size, hash, status, " +
"and mesh replication info. Use this to verify backup integrity or check sync status.",
operationId: "backup-read",
tags: ["Backups"],
};
}
