import { Hono } from "hono";
import { fromHono } from "chanfana";
import { MultipassVmList } from "./vmList";
import { MultipassVmLaunch } from "./vmLaunch";
import { MultipassVmStatus } from "./vmStatus";
import { MultipassVmDelete } from "./vmDelete";
import { MultipassFleetHealth } from "./fleetHealth";
import { authorizeMultipassRequest } from "./security";

export const multipassRouter = fromHono(new Hono<{ Bindings: Env }>());

// Multipass inventory and mutations are infrastructure control-plane operations.
// Fail closed before any D1 access when strong server-managed credentials are absent.
multipassRouter.use("*", async (c, next) => {
  const env = c.env as Env & {
    DARCLOUD_MULTIPASS_READ_TOKEN?: string;
    DARCLOUD_MULTIPASS_MUTATION_TOKEN?: string;
  };
  const authorization = await authorizeMultipassRequest(
    c.req.method,
    c.req.header("Authorization"),
    env.DARCLOUD_MULTIPASS_READ_TOKEN,
    env.DARCLOUD_MULTIPASS_MUTATION_TOKEN,
  );
  if (!authorization.ok) {
    return c.json({ success: false, error: authorization.error }, authorization.status);
  }
  await next();
  c.res.headers.set("Cache-Control", "no-store");
});

multipassRouter.get("/vms", MultipassVmList);
multipassRouter.post("/vms/launch", MultipassVmLaunch);
multipassRouter.get("/vms/:id/status", MultipassVmStatus);
multipassRouter.delete("/vms/:id", MultipassVmDelete);
multipassRouter.get("/fleet/health", MultipassFleetHealth);
