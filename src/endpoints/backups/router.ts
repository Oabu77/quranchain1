import { Hono } from "hono";
import { fromHono } from "chanfana";
import { BackupList } from "./backupList";
import { BackupCreate } from "./backupCreate";
import { BackupRead } from "./backupRead";
import { BackupUpdate } from "./backupUpdate";
import { BackupDelete } from "./backupDelete";
import { authorizeBackupRequest } from "./security";

export const backupsRouter = fromHono(new Hono<{ Bindings: Env }>());

// Backup inventory is recovery control-plane data. Authenticate before any D1-backed
// list/read/create/update/delete handler executes, and separate read-only authority
// from mutation authority.
backupsRouter.use("*", async (c, next) => {
  const env = c.env as Env & {
    DARCLOUD_BACKUPS_READ_TOKEN?: string;
    DARCLOUD_BACKUPS_MUTATION_TOKEN?: string;
  };

  const authorization = await authorizeBackupRequest(
    c.req.method,
    c.req.header("Authorization"),
    env.DARCLOUD_BACKUPS_READ_TOKEN,
    env.DARCLOUD_BACKUPS_MUTATION_TOKEN,
  );

  if (!authorization.ok) {
    return c.json({ success: false, error: authorization.error }, authorization.status);
  }

  await next();
  c.res.headers.set("Cache-Control", "no-store");
});

backupsRouter.get("/", BackupList);
backupsRouter.post("/", BackupCreate);
backupsRouter.get("/:id", BackupRead);
backupsRouter.put("/:id", BackupUpdate);
backupsRouter.delete("/:id", BackupDelete);
