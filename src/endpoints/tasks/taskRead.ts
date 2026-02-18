import { D1ReadEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskRead extends D1ReadEndpoint<HandleArgs> {
_meta = {
model: TaskModel,
summary: "Get a single task by ID with full details",
description:
"Retrieves the complete task record including name, description, completion status, " +
"and due date. Use this to check progress on specific infrastructure work items.",
operationId: "task-read",
tags: ["Tasks"],
};
}
