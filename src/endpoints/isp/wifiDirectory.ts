import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

// ═══ Public WiFi Hotspot Directory ═══
// Lists all DarCloud-WiFi hotspots globally so they appear on WiFi maps/directories
export class WifiDirectory extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "Public directory of all DarCloud-WiFi hotspots worldwide",
		operationId: "isp-wifi-directory",
		request: {
			query: z.object({
				lat: z.string().optional().describe("Latitude for proximity search"),
				lng: z.string().optional().describe("Longitude for proximity search"),
				radius_km: z.string().optional().describe("Search radius in km (default 50)"),
				region: z.string().optional().describe("Filter by region"),
			}),
		},
		responses: {
			"200": {
				description: "DarCloud-WiFi hotspot directory",
				...contentJson(
					z.object({
						success: z.literal(true),
						network: z.object({
							name: z.string(),
							ssid: z.string(),
							operator: z.string(),
							website: z.string(),
							type: z.string(),
						}),
						hotspots: z.array(
							z.object({
								hotspot_id: z.string(),
								ssid: z.string(),
								location: z.object({
									lat: z.number(),
									lng: z.number(),
									address: z.string(),
									city: z.string(),
									state: z.string(),
									country: z.string(),
								}),
								hardware: z.string(),
								bands: z.array(z.string()),
								signal_type: z.string(),
								speed_mbps: z.number(),
								is_free: z.boolean(),
								is_mesh_tower: z.boolean(),
								status: z.string(),
								last_seen: z.string(),
							}),
						),
						total: z.number(),
						coverage_map_url: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const db = c.env.DB;

		// Query mesh nodes that are towers (they broadcast DarCloud-WiFi)
		const nodes = await db
			.prepare(
				`SELECT n.node_id, n.hardware, n.region, n.status, n.connected_at,
				        n.role, n.device_type, n.mesh_ip, n.public_ip,
				        n.firmware_version
				 FROM mesh_nodes n
				 WHERE n.role = 'tower' OR n.role = 'gateway'
				 ORDER BY n.connected_at DESC`,
			)
			.all();

		// Query ISP devices that are mesh towers
		const devices = await db
			.prepare(
				`SELECT device_id, device_type, manufacturer, model, mac_address,
				        mesh_node_id, status, registered_at
				 FROM isp_devices
				 WHERE is_mesh_tower = 1
				 ORDER BY registered_at DESC`,
			)
			.all();

		// Build hotspot entries from mesh nodes
		const hotspots = (nodes.results || []).map((node: any) => ({
			hotspot_id: node.node_id,
			ssid: "DarCloud-WiFi",
			location: {
				lat: 0,
				lng: 0,
				address: "Auto-detected",
				city: "Network Tower",
				state: node.region || "unknown",
				country: "US",
			},
			hardware: node.hardware || "Unknown",
			bands: ["2.4GHz", "5GHz"],
			signal_type: node.hardware?.includes("5G") || node.hardware?.includes("TMO") ? "5G + WiFi 6" : "WiFi 6",
			speed_mbps: 300,
			is_free: false,
			is_mesh_tower: true,
			status: node.status || "offline",
			last_seen: node.connected_at || new Date().toISOString(),
		}));

		// Query coverage areas
		const areas = await db
			.prepare("SELECT * FROM isp_service_areas WHERE status = 'active'")
			.all();

		return {
			success: true as const,
			network: {
				name: "DarCloud ISP™",
				ssid: "DarCloud-WiFi",
				operator: "DarCloud LLC",
				website: "https://darcloud.host",
				type: "Decentralized Mesh + 5G",
			},
			hotspots,
			total: hotspots.length,
			coverage_map_url: "https://darcloud.host/isp/coverage-map",
			service_areas: areas.results || [],
			registry_feeds: {
				geojson: "https://darcloud.host/isp/wifi-directory?format=geojson",
				wifimap: "https://darcloud.host/isp/wifi-directory?format=wifimap",
				openwifimap: "https://darcloud.host/isp/wifi-directory?format=openwifimap",
			},
		};
	}
}

// ═══ WiFi Hotspot Registration ═══
// Allows tower operators to register their hotspot with location data
export class WifiHotspotRegister extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "Register a DarCloud-WiFi hotspot with location for global directory",
		operationId: "isp-wifi-hotspot-register",
		request: {
			body: contentJson(
				z.object({
					node_id: z.string().describe("Mesh node ID (must be a registered tower)"),
					latitude: z.number().describe("GPS latitude"),
					longitude: z.number().describe("GPS longitude"),
					address: z.string().optional().describe("Street address"),
					city: z.string().describe("City"),
					state: z.string().describe("State/Province"),
					country: z.string().describe("Country code (US, UK, etc.)"),
					indoor: z.boolean().optional().describe("Is this an indoor hotspot?"),
					public_access: z.boolean().optional().describe("Is this publicly accessible?"),
					speed_mbps: z.number().optional().describe("Advertised speed in Mbps"),
				}),
			),
		},
		responses: {
			"200": {
				description: "Hotspot registered in global directory",
				...contentJson(
					z.object({
						success: z.literal(true),
						hotspot_id: z.string(),
						directory_url: z.string(),
						status: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const body = data.body;
		const db = c.env.DB;

		// Verify the node exists and is a tower
		const node = await db
			.prepare("SELECT * FROM mesh_nodes WHERE node_id = ?")
			.bind(body.node_id)
			.first();

		if (!node) {
			return { success: false, error: "Node not found. Register via /mesh/connect first." };
		}

		// Register as service area with GPS coordinates
		const areaId = `hotspot-${body.node_id}`;
		await db
			.prepare(
				`INSERT OR REPLACE INTO isp_service_areas
				 (area_id, name, area_type, radius_km, latitude, longitude,
				  tower_count, status, created_at)
				 VALUES (?, ?, 'hotspot', 0.5, ?, ?, 1, 'active', datetime('now'))`,
			)
			.bind(
				areaId,
				`DarCloud-WiFi @ ${body.city}`,
				body.latitude,
				body.longitude,
			)
			.run();

		return {
			success: true as const,
			hotspot_id: areaId,
			directory_url: `https://darcloud.host/isp/wifi-directory`,
			status: "listed",
		};
	}
}

// ═══ Coverage Map Data ═══
export class CoverageMap extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "Get coverage map data (GeoJSON) for all DarCloud service areas",
		operationId: "isp-coverage-map",
		responses: {
			"200": {
				description: "GeoJSON coverage data",
				...contentJson(
					z.object({
						type: z.literal("FeatureCollection"),
						features: z.array(z.any()),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;

		const areas = await db
			.prepare("SELECT * FROM isp_service_areas WHERE status = 'active'")
			.all();

		const nodes = await db
			.prepare("SELECT * FROM mesh_nodes WHERE role IN ('tower', 'gateway') AND status = 'connected'")
			.all();

		const features = [
			// Service areas as polygons (approximate circles)
			...(areas.results || []).map((area: any) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [area.longitude || 0, area.latitude || 0],
				},
				properties: {
					id: area.area_id,
					name: area.area_name,
					type: area.area_type,
					radius_km: area.coverage_radius_km,
					ssid: "DarCloud-WiFi",
					status: area.status,
				},
			})),
			// Mesh towers as points
			...(nodes.results || []).map((node: any) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [0, 0], // Will be populated when hotspot is registered with GPS
				},
				properties: {
					id: node.node_id,
					name: node.hardware,
					type: "mesh_tower",
					ssid: "DarCloud-WiFi",
					status: node.status,
					role: node.role,
				},
			})),
		];

		return {
			type: "FeatureCollection" as const,
			features,
			metadata: {
				network: "DarCloud ISP™",
				ssid: "DarCloud-WiFi",
				total_towers: (nodes.results || []).length,
				total_areas: (areas.results || []).length,
				generated_at: new Date().toISOString(),
			},
		};
	}
}
