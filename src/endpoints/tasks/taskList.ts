import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskList extends D1ListEndpoint<HandleArgs> {
_meta = {
model: TaskModel,
summary: "List all operational tasks with search and pagination",
description:
"Retrieves paginated task records from the D1 task registry. Supports full-text search " +
"across name, slug, and description fields. Tasks represent real operational work items " +
"for the QuranChain infrastructure — deployments, migrations, audits, etc.",
operationId: "task-list",
tags: ["Tasks"],
};

searchFields = ["name", "slug", "description"];
defaultOrderBy = "id DESC";
}
