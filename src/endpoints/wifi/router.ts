import { Hono } from "hono";
import { fromHono } from "chanfana";
import {
  WifiGatewayRegister,
  WifiGatewayHeartbeat,
  WifiGatewayStatus,
  WifiGatewayClients,
} from "./wifiGateway";

export const wifiRouter = fromHono(new Hono());

wifiRouter.get("/status", WifiGatewayStatus);
wifiRouter.get("/clients", WifiGatewayClients);
wifiRouter.post("/register", WifiGatewayRegister);
wifiRouter.post("/heartbeat", WifiGatewayHeartbeat);
