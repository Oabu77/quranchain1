import { Hono } from "hono";
import { fromHono } from "chanfana";
import { MultipassVmList } from "./vmList";
import { MultipassVmLaunch } from "./vmLaunch";
import { MultipassVmStatus } from "./vmStatus";
import { MultipassVmDelete } from "./vmDelete";
import { MultipassFleetHealth } from "./fleetHealth";

export const multipassRouter = fromHono(new Hono());

multipassRouter.get("/vms", MultipassVmList);
multipassRouter.post("/vms/launch", MultipassVmLaunch);
multipassRouter.get("/vms/:id/status", MultipassVmStatus);
multipassRouter.delete("/vms/:id", MultipassVmDelete);
multipassRouter.get("/fleet/health", MultipassFleetHealth);
