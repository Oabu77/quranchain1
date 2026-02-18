import { D1DeleteEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskDelete extends D1DeleteEndpoint<HandleArgs> {
_meta = {
model: TaskModel,
summary: "Permanently delete a task from the registry",
description:
"Removes the task record from D1. This action cannot be undone. " +
"Consider marking the task as completed instead of deleting it " +
"to maintain an audit trail of infrastructure work.",
operationId: "task-delete",
tags: ["Tasks"],
};
}
