import { Hono } from "hono";
import { fromHono } from "chanfana";
import { BackupList } from "./backupList";
import { BackupCreate } from "./backupCreate";
import { BackupRead } from "./backupRead";
import { BackupUpdate } from "./backupUpdate";
import { BackupDelete } from "./backupDelete";

export const backupsRouter = fromHono(new Hono());

backupsRouter.get("/", BackupList);
backupsRouter.post("/", BackupCreate);
backupsRouter.get("/:id", BackupRead);
backupsRouter.put("/:id", BackupUpdate);
backupsRouter.delete("/:id", BackupDelete);
