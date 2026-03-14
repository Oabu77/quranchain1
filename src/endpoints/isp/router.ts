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

export const ispRouter = fromHono(new Hono());

// Dashboard
ispRouter.get("/dashboard", IspDashboard);

// Plans
ispRouter.get("/plans", IspPlans);

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

// Service Areas / Coverage
ispRouter.get("/coverage", IspServiceAreas);

// WiFi Hotspot Directory (public — shows up on global WiFi maps)
ispRouter.get("/wifi-directory", WifiDirectory);
ispRouter.post("/wifi-hotspot/register", WifiHotspotRegister);
ispRouter.get("/coverage-map", CoverageMap);

// Satellite Tracking (public CelesTrak data — fully legal)
ispRouter.get("/satellites", SatelliteTracker);
ispRouter.get("/satellites/overhead", SatellitesOverhead);

// Ground Stations (satellite uplink nodes)
ispRouter.get("/ground-stations", GroundStations);
ispRouter.post("/ground-stations/register", GroundStationRegister);

// Cell Tower Registry (Discord mesh nodes as virtual towers)
ispRouter.get("/towers", CellTowerRegistry);
ispRouter.get("/signal-map", SignalMap);
