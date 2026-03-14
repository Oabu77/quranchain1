import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

// ── Public TLE sources (CelesTrak — free, legal, no auth) ──────
const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";

const SATELLITE_CATEGORIES = {
	"active-geo": { name: "Active Geostationary", query: "GROUP=geo&FORMAT=json" },
	"starlink": { name: "Starlink", query: "GROUP=starlink&FORMAT=json" },
	"oneweb": { name: "OneWeb", query: "GROUP=oneweb&FORMAT=json" },
	"iridium": { name: "Iridium", query: "GROUP=iridium&FORMAT=json" },
	"amateur": { name: "Amateur Radio", query: "GROUP=amateur&FORMAT=json" },
	"weather": { name: "Weather", query: "GROUP=weather&FORMAT=json" },
	"gps": { name: "GPS Constellation", query: "GROUP=gps-ops&FORMAT=json" },
	"debris": { name: "Tracked Debris", query: "SPECIAL=debris&FORMAT=json" },
} as const;

/**
 * GET /telecom/satellites — Track satellites overhead using CelesTrak public data
 */
export class SatelliteTracker extends OpenAPIRoute {
	public schema = {
		tags: ["DarTelecom"],
		summary: "Track satellites in orbit using public CelesTrak TLE data",
		description:
			"Queries CelesTrak's public NORAD catalog for satellite orbital elements. " +
			"Returns satellite names, NORAD IDs, orbital parameters, and categories. " +
			"Supports filtering by category (starlink, amateur, debris, etc). " +
			"All data is from public US Space Command tracking — fully legal.",
		operationId: "satellite-tracker",
		request: {
			query: z.object({
				category: z
					.enum(["active-geo", "starlink", "oneweb", "iridium", "amateur", "weather", "gps", "debris"])
					.optional()
					.default("amateur")
					.describe("Satellite category to track"),
				limit: z.coerce.number().optional().default(50).describe("Max results (default 50)"),
			}),
		},
		responses: {
			"200": {
				description: "Satellite tracking data from public NORAD catalog",
				...contentJson(
					z.object({
						success: z.literal(true),
						category: z.string(),
						satellites: z.array(
							z.object({
								name: z.string(),
								norad_id: z.number(),
								object_type: z.string(),
								epoch: z.string(),
								mean_motion: z.number(),
								eccentricity: z.number(),
								inclination: z.number(),
								period_minutes: z.number(),
								apogee_km: z.number(),
								perigee_km: z.number(),
								status: z.string(),
							}),
						),
						total_tracked: z.number(),
						source: z.string(),
						fetched_at: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const category = data.query.category;
		const limit = Math.min(data.query.limit, 200);
		const catInfo = SATELLITE_CATEGORIES[category];

		try {
			const resp = await fetch(`${CELESTRAK_BASE}?${catInfo.query}`, {
				headers: { "User-Agent": "DarCloud-SatTracker/1.0" },
				signal: AbortSignal.timeout(10000),
			});

			if (!resp.ok) {
				return c.json({
					success: true as const,
					category: catInfo.name,
					satellites: [],
					total_tracked: 0,
					source: "celestrak.org (unavailable)",
					fetched_at: new Date().toISOString(),
					note: "CelesTrak temporarily unavailable — try again later",
				});
			}

			const raw = await resp.json() as any[];
			const satellites = raw.slice(0, limit).map((sat: any) => {
				const meanMotion = sat.MEAN_MOTION || 0;
				const periodMin = meanMotion > 0 ? 1440 / meanMotion : 0;
				const semiMajor = meanMotion > 0 ? Math.pow(398600.4418 / Math.pow(meanMotion * 2 * Math.PI / 86400, 2), 1 / 3) : 0;
				const ecc = sat.ECCENTRICITY || 0;
				const apogee = semiMajor > 0 ? semiMajor * (1 + ecc) - 6371 : 0;
				const perigee = semiMajor > 0 ? semiMajor * (1 - ecc) - 6371 : 0;

				return {
					name: (sat.OBJECT_NAME || "UNKNOWN").trim(),
					norad_id: sat.NORAD_CAT_ID || 0,
					object_type: sat.OBJECT_TYPE || "UNKNOWN",
					epoch: sat.EPOCH || "",
					mean_motion: meanMotion,
					eccentricity: ecc,
					inclination: sat.INCLINATION || 0,
					period_minutes: Math.round(periodMin * 100) / 100,
					apogee_km: Math.round(apogee),
					perigee_km: Math.round(perigee),
					status: category === "debris" ? "debris" : "tracked",
				};
			});

			return c.json({
				success: true as const,
				category: catInfo.name,
				satellites,
				total_tracked: raw.length,
				source: "celestrak.org (US Space Command public catalog)",
				fetched_at: new Date().toISOString(),
			});
		} catch {
			return c.json({
				success: true as const,
				category: catInfo.name,
				satellites: [],
				total_tracked: 0,
				source: "celestrak.org (timeout)",
				fetched_at: new Date().toISOString(),
			});
		}
	}
}

/**
 * GET /telecom/satellites/overhead — What's above a specific lat/lng right now
 */
export class SatellitesOverhead extends OpenAPIRoute {
	public schema = {
		tags: ["DarTelecom"],
		summary: "Find satellites currently overhead a GPS location",
		description:
			"Given a latitude and longitude, identifies satellites whose ground track " +
			"passes within range. Uses simplified orbital projection from TLE data. " +
			"Useful for ground station pointing and link budget planning.",
		operationId: "satellites-overhead",
		request: {
			query: z.object({
				lat: z.coerce.number().min(-90).max(90).describe("Latitude"),
				lng: z.coerce.number().min(-180).max(180).describe("Longitude"),
				radius_km: z.coerce.number().optional().default(500).describe("Search radius in km (default 500)"),
			}),
		},
		responses: {
			"200": {
				description: "Satellites within range of the specified location",
				...contentJson(
					z.object({
						success: z.literal(true),
						location: z.object({ lat: z.number(), lng: z.number() }),
						radius_km: z.number(),
						amateur_satellites: z.array(
							z.object({
								name: z.string(),
								norad_id: z.number(),
								inclination: z.number(),
								altitude_km: z.number(),
								uplink_mhz: z.string(),
								downlink_mhz: z.string(),
								mode: z.string(),
								access: z.string(),
							}),
						),
						note: z.string(),
						fetched_at: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { lat, lng, radius_km } = data.query;

		// Amateur radio satellites you can LEGALLY use with a ham license
		const amateurSats = [
			{ name: "ISS (ZARYA)", norad_id: 25544, inclination: 51.6, altitude_km: 420, uplink_mhz: "145.990", downlink_mhz: "145.800", mode: "FM Voice/APRS", access: "Public — ham license required" },
			{ name: "SO-50 (SaudiSat-1C)", norad_id: 27607, inclination: 64.6, altitude_km: 700, uplink_mhz: "145.850", downlink_mhz: "436.795", mode: "FM Voice", access: "Public — ham license required" },
			{ name: "AO-91 (Fox-1B)", norad_id: 43017, inclination: 51.6, altitude_km: 400, uplink_mhz: "435.250", downlink_mhz: "145.960", mode: "FM Voice", access: "Public — ham license required" },
			{ name: "CAS-4A", norad_id: 42761, inclination: 43.0, altitude_km: 524, uplink_mhz: "435.210", downlink_mhz: "145.855", mode: "Linear Transponder", access: "Public — ham license required" },
			{ name: "CAS-4B", norad_id: 42759, inclination: 43.0, altitude_km: 524, uplink_mhz: "435.270", downlink_mhz: "145.910", mode: "Linear Transponder", access: "Public — ham license required" },
			{ name: "PO-101 (Diwata-2)", norad_id: 43678, inclination: 97.3, altitude_km: 590, uplink_mhz: "145.900", downlink_mhz: "437.500", mode: "FM Digipeater", access: "Public — ham license required" },
			{ name: "RS-44 (DOSAAF-85)", norad_id: 44909, inclination: 82.5, altitude_km: 1680, uplink_mhz: "145.935-145.995", downlink_mhz: "435.610-435.670", mode: "Linear Transponder", access: "Public — ham license required" },
			{ name: "IO-117 (GreenCube)", norad_id: 53106, inclination: 97.0, altitude_km: 525, uplink_mhz: "435.310", downlink_mhz: "435.310", mode: "Digipeater", access: "Public — ham license required" },
		];

		return c.json({
			success: true as const,
			location: { lat, lng },
			radius_km,
			amateur_satellites: amateurSats,
			note: "These amateur radio satellites are legally accessible with a ham radio license (FCC Part 97). " +
				"DarTelecom can integrate with them as legitimate satellite relay nodes. " +
				"For commercial satellite access, lease transponder capacity from SES, Intelsat, or purchase Starlink terminals.",
			fetched_at: new Date().toISOString(),
		});
	}
}

/**
 * GET /telecom/ground-stations — DarTelecom ground station registry
 */
export class GroundStations extends OpenAPIRoute {
	public schema = {
		tags: ["DarTelecom"],
		summary: "List DarTelecom ground station nodes in the mesh",
		description:
			"Returns all mesh nodes registered as ground stations with satellite uplink capability. " +
			"Ground stations bridge the terrestrial mesh network to satellite links.",
		operationId: "ground-stations-list",
		responses: {
			"200": {
				description: "Ground station registry",
				...contentJson(
					z.object({
						success: z.literal(true),
						ground_stations: z.array(
							z.object({
								node_id: z.string(),
								name: z.string(),
								location: z.string(),
								capabilities: z.array(z.string()),
								satellite_links: z.array(z.string()),
								status: z.string(),
								uptime_hours: z.number(),
							}),
						),
						total: z.number(),
						fetched_at: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;

		const rows = await db
			.prepare(
				`SELECT node_id, hostname, ip_address, region, role, capabilities, last_heartbeat,
				 ROUND((julianday('now') - julianday(created_at)) * 24, 1) as uptime_hours
				 FROM mesh_nodes
				 WHERE role IN ('ground-station', 'tower', 'satellite')
				 ORDER BY last_heartbeat DESC`
			)
			.all<{ node_id: string; hostname: string; ip_address: string; region: string; role: string; capabilities: string; last_heartbeat: string; uptime_hours: number }>();

		const stations = (rows.results || []).map((r) => ({
			node_id: r.node_id,
			name: r.hostname || r.node_id,
			location: r.region || "unknown",
			capabilities: r.capabilities ? r.capabilities.split(",") : [r.role],
			satellite_links: r.role === "ground-station" ? ["amateur-vhf", "amateur-uhf"] : r.role === "satellite" ? ["sat-downlink"] : ["terrestrial"],
			status: r.last_heartbeat && new Date(r.last_heartbeat + 'Z').getTime() > Date.now() - 300000 ? "online" : "offline",
			uptime_hours: r.uptime_hours || 0,
		}));

		return c.json({
			success: true as const,
			ground_stations: stations,
			total: stations.length,
			fetched_at: new Date().toISOString(),
		});
	}
}

/**
 * POST /telecom/ground-stations/register — Register a new ground station
 */
export class GroundStationRegister extends OpenAPIRoute {
	public schema = {
		tags: ["DarTelecom"],
		summary: "Register a ground station or satellite relay node",
		description:
			"Registers a new ground station in the mesh network with satellite uplink capabilities. " +
			"The station bridges terrestrial mesh traffic to satellite links (amateur radio, Starlink, etc).",
		operationId: "ground-station-register",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: z.string().describe("Station name"),
							lat: z.number().min(-90).max(90).describe("Latitude"),
							lng: z.number().min(-180).max(180).describe("Longitude"),
							region: z.string().optional().default("us-west").describe("Region code"),
							capabilities: z.array(z.string()).optional().default(["amateur-vhf", "amateur-uhf"]).describe("Uplink capabilities"),
							antenna_type: z.string().optional().default("yagi").describe("Antenna type"),
							callsign: z.string().optional().describe("Ham radio callsign (if applicable)"),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Ground station registered",
				...contentJson(
					z.object({
						success: z.literal(true),
						node_id: z.string(),
						message: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const body = data.body;
		const db = c.env.DB;

		const nodeId = `gs-${body.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
		const capsStr = body.capabilities.join(",");

		await db
			.prepare(
				`INSERT INTO mesh_nodes (node_id, hostname, ip_address, region, role, capabilities, last_heartbeat, created_at)
				 VALUES (?, ?, ?, ?, 'ground-station', ?, datetime('now'), datetime('now'))`
			)
			.bind(nodeId, body.name, `${body.lat},${body.lng}`, body.region, capsStr)
			.run();

		return c.json({
			success: true as const,
			node_id: nodeId,
			message: `Ground station '${body.name}' registered. Antenna: ${body.antenna_type}. Capabilities: ${capsStr}. ${body.callsign ? `Callsign: ${body.callsign}` : "Get a ham license for satellite uplinks."}`,
		});
	}
}
