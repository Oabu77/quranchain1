import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { BackupModel } from "./base";

export class BackupList extends D1ListEndpoint<HandleArgs> {
_meta = {
model: BackupModel,
summary: "List all DarCloud backup files with search and filtering",
description:
"Retrieves paginated backup records from the D1 registry. Supports full-text search " +
"across filename, label, hardware, and status fields. Ordered by newest first. " +
"Each record includes file hash for integrity verification and mesh replication status.",
operationId: "backup-list",
tags: ["Backups"],
};

searchFields = ["filename", "label", "hardware", "status"];
defaultOrderBy = "created_at DESC";
}
