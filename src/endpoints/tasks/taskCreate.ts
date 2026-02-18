import { D1CreateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskCreate extends D1CreateEndpoint<HandleArgs> {
_meta = {
model: TaskModel,
fields: TaskModel.schema.pick({
name: true,
slug: true,
description: true,
completed: true,
due_date: true,
}),
summary: "Create a new operational task for the QuranChain infrastructure",
description:
"Registers a new task with a name, slug, description, and due date. Tasks track " +
"real infrastructure work: VM provisioning, mesh node deployment, backup scheduling, " +
"security audits, etc. Set completed to false initially.",
operationId: "task-create",
tags: ["Tasks"],
};
}
