import { Hono } from "hono";
import { fromHono } from "chanfana";
import { MinecraftServers } from "./servers";
import { MinecraftBackups } from "./backups";
import { MinecraftServerStatus } from "./serverStatus";

export const minecraftRouter = fromHono(new Hono());

minecraftRouter.get("/servers", MinecraftServers);
minecraftRouter.get("/servers/:serverId", MinecraftServerStatus);
minecraftRouter.get("/backups", MinecraftBackups);
