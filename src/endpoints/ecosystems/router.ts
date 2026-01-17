import { Hono } from "hono";
import { fromHono } from "chanfana";
import { EcosystemList } from "./ecosystemList";
import { EcosystemCreate } from "./ecosystemCreate";
import { EcosystemRead } from "./ecosystemRead";
import { EcosystemUpdate } from "./ecosystemUpdate";
import { EcosystemDelete } from "./ecosystemDelete";

export const ecosystemsRouter = fromHono(new Hono());

ecosystemsRouter.get("/", EcosystemList);
ecosystemsRouter.post("/", EcosystemCreate);
ecosystemsRouter.get("/:id", EcosystemRead);
ecosystemsRouter.put("/:id", EcosystemUpdate);
ecosystemsRouter.delete("/:id", EcosystemDelete);
