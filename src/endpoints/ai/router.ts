import { Hono } from "hono";
import { fromHono } from "chanfana";
import { AIFleet } from "./aiFleet";
import { AIAssistants } from "./aiAssistants";
import { AIBenchmark } from "./aiBenchmark";

export const aiRouter = fromHono(new Hono());

aiRouter.get("/fleet", AIFleet);
aiRouter.get("/assistants", AIAssistants);
aiRouter.get("/benchmark", AIBenchmark);
