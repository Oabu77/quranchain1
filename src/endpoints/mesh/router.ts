import { Hono } from "hono";
import { fromHono } from "chanfana";
import { MeshStatus } from "./meshStatus";
import { MeshNodes } from "./meshNodes";
import { MeshConnect } from "./meshConnect";
import { MeshHeartbeat } from "./meshHeartbeat";
import { MeshPeers, MeshTopology } from "./meshCoordinator";

export const meshRouter = fromHono(new Hono());

meshRouter.get("/status", MeshStatus);
meshRouter.get("/nodes", MeshNodes);
meshRouter.get("/topology", MeshTopology);
meshRouter.get("/peers/:nodeId", MeshPeers);
meshRouter.post("/connect", MeshConnect);
meshRouter.post("/heartbeat", MeshHeartbeat);
