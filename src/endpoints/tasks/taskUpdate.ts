import { D1UpdateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskUpdate extends D1UpdateEndpoint<HandleArgs> {
_meta = {
model: TaskModel,
fields: TaskModel.schema.pick({
name: true,
slug: true,
description: true,
completed: true,
due_date: true,
}),
summary: "Update a task — mark complete, change deadline, or edit details",
description:
"Updates an existing task record. Common workflows: mark a task as completed, " +
"extend the due date, or update the description with progress notes. " +
"All fields are optional — only provided fields are updated.",
operationId: "task-update",
tags: ["Tasks"],
};
}
