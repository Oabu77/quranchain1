import { Hono } from "hono";
import { fromHono } from "chanfana";
import {
	IspPlans,
	IspSubscribers,
	IspSubscriberProvision,
	IspDevices,
	IspDeviceRegister,
	IspFirmwareList,
	IspCellularList,
	IspCellularProvision,
	IspServiceAreas,
	IspDashboard,
} from "./ispEndpoints";
import { WifiDirectory, WifiHotspotRegister, CoverageMap } from "./wifiDirectory";
import { SatelliteTracker, SatellitesOverhead, GroundStations, GroundStationRegister } from "./satelliteTracker";
import { CellTowerRegistry, SignalMap } from "./cellTowers";
import { authorizeIspRequest } from "./security";

export const ispRouter = fromHono(new Hono<{ Bindings: Env }>());

// Deliberately public catalog/map routes. These must remain before the control-plane gate.
ispRouter.get("/plans", IspPlans);
ispRouter.get("/wifi-directory", WifiDirectory);
ispRouter.get("/coverage-map", CoverageMap);
ispRouter.get("/satellites", SatelliteTracker);
ispRouter.get("/satellites/overhead", SatellitesOverhead);

// Everything below this point is ISP/telecom infrastructure control-plane data or mutation.
// Fail closed before handlers and D1 access when strong server-managed credentials are absent.
ispRouter.use("*", async (c, next) => {
  const env = c.env as Env & {
    DARCLOUD_ISP_READ_TOKEN?: string;
    DARCLOUD_ISP_MUTATION_TOKEN?: string;
  };
  const authorization = await authorizeIspRequest(
    c.req.method,
    c.req.header("Authorization"),
    env.DARCLOUD_ISP_READ_TOKEN,
    env.DARCLOUD_ISP_MUTATION_TOKEN,
  );
  if (!authorization.ok) {
    return c.json({ success: false, error: authorization.error }, authorization.status);
  }
  await next();
  c.res.headers.set("Cache-Control", "no-store");
});

// Dashboard
ispRouter.get("/dashboard", IspDashboard);

// Subscribers
ispRouter.get("/subscribers", IspSubscribers);
ispRouter.post("/subscribers/provision", IspSubscriberProvision);

// Devices (routers, smart devices, mesh towers)
ispRouter.get("/devices", IspDevices);
ispRouter.post("/devices/register", IspDeviceRegister);

// Firmware
ispRouter.get("/firmware", IspFirmwareList);

// Cellular Data (Open5GS integration)
ispRouter.get("/cellular", IspCellularList);
ispRouter.post("/cellular/provision", IspCellularProvision);

// Service Areas / Coverage administration
ispRouter.get("/coverage", IspServiceAreas);

// WiFi hotspot registration mutates the service directory.
ispRouter.post("/wifi-hotspot/register", WifiHotspotRegister);

// Ground Stations (satellite uplink nodes)
ispRouter.get("/ground-stations", GroundStations);
ispRouter.post("/ground-stations/register", GroundStationRegister);

// Cell Tower Registry (Discord mesh nodes as virtual towers)
ispRouter.get("/towers", CellTowerRegistry);
ispRouter.get("/signal-map", SignalMap);
