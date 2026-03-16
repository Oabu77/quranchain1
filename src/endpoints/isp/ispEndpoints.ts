import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

// ═══ ISP Plans ═══
export class IspPlans extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "List all DarCloud ISP plans (Home, Business, Cellular, Mesh)",
		operationId: "isp-plans-list",
		request: {
			query: z.object({
				type: z.string().optional().describe("Filter by plan type: home, business, cellular, mesh"),
			}),
		},
		responses: {
			"200": {
				description: "Available ISP plans",
				...contentJson(
					z.object({
						success: z.literal(true),
						plans: z.array(z.object({
							plan_id: z.string(),
							name: z.string(),
							speed_mbps: z.number(),
							data_cap_gb: z.number(),
							monthly_price: z.number(),
							type: z.string(),
							features: z.any(),
							status: z.string(),
						})),
						total: z.number(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const type = data.query.type;
		const db = c.env.DB;

		let query = "SELECT * FROM isp_plans WHERE status = 'active'";
		const binds: string[] = [];
		if (type) {
			query += " AND type = ?";
			binds.push(type);
		}
		query += " ORDER BY monthly_price ASC";

		const stmt = binds.length > 0 ? db.prepare(query).bind(...binds) : db.prepare(query);
		const rows = await stmt.all();

		const plans = (rows.results || []).map((r: any) => ({
			...r,
			features: r.features ? JSON.parse(r.features) : {},
		}));

		return { success: true as const, plans, total: plans.length };
	}
}

// ═══ ISP Subscribers ═══
export class IspSubscribers extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "List ISP subscribers with filtering",
		operationId: "isp-subscribers-list",
		request: {
			query: z.object({
				status: z.string().optional().describe("Filter: active, suspended, terminated"),
				plan: z.string().optional().describe("Filter by plan type"),
			}),
		},
		responses: {
			"200": {
				description: "Subscriber list",
				...contentJson(
					z.object({
						success: z.literal(true),
						subscribers: z.array(z.any()),
						total: z.number(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const db = c.env.DB;

		let query = "SELECT * FROM telecom_subscribers WHERE 1=1";
		const binds: string[] = [];
		if (data.query.status) {
			query += " AND status = ?";
			binds.push(data.query.status);
		}
		if (data.query.plan) {
			query += " AND plan = ?";
			binds.push(data.query.plan);
		}
		query += " ORDER BY created_at DESC LIMIT 100";

		const stmt = binds.length > 0 ? db.prepare(query).bind(...binds) : db.prepare(query);
		const rows = await stmt.all();

		return { success: true as const, subscribers: rows.results || [], total: rows.results?.length || 0 };
	}
}

// ═══ ISP Subscriber Provision ═══
export class IspSubscriberProvision extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "Provision a new ISP subscriber (Home, Business, or Cellular)",
		operationId: "isp-subscriber-provision",
		request: {
			body: contentJson(
				z.object({
					subscriber_id: z.string().describe("Unique subscriber ID"),
					name: z.string().describe("Customer name"),
					email: z.string().email().describe("Customer email"),
					plan: z.string().describe("Plan ID (home_basic, biz_pro, cell_unlimited, etc.)"),
					address: z.string().optional().describe("Service address for home/business"),
					phone: z.string().optional().describe("Phone number"),
				}),
			),
		},
		responses: {
			"200": {
				description: "Subscriber provisioned",
				...contentJson(
					z.object({
						success: z.literal(true),
						subscriber_id: z.string(),
						plan: z.string(),
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

		// Generate IMSI for cellular plans
		const isCellular = body.plan.startsWith("cell_");
		const imsi = isCellular ? `999700${Date.now().toString().slice(-9)}` : `sub-${Date.now()}`;

		await db
			.prepare(
				`INSERT OR REPLACE INTO telecom_subscribers
				 (subscriber_id, imsi, name, email, plan, status, data_used_mb, created_at)
				 VALUES (?, ?, ?, ?, ?, 'active', 0, datetime('now'))`,
			)
			.bind(
				body.subscriber_id,
				imsi,
				body.subscriber_id,
				"",
				body.plan,
			)
			.run();

		return {
			success: true as const,
			subscriber_id: body.subscriber_id,
			plan: body.plan,
			status: "active",
			...(isCellular ? { imsi, apn: "darcloud.isp" } : {}),
		};
	}
}

// ═══ ISP Devices ═══
export class IspDevices extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "List customer devices (routers, smart devices, mesh nodes)",
		operationId: "isp-devices-list",
		request: {
			query: z.object({
				subscriber_id: z.string().optional(),
				device_type: z.string().optional(),
				mesh_enabled: z.string().optional().describe("Filter mesh-enabled devices: 1 or 0"),
			}),
		},
		responses: {
			"200": {
				description: "Device list",
				...contentJson(
					z.object({
						success: z.literal(true),
						devices: z.array(z.any()),
						total: z.number(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const db = c.env.DB;

		let query = "SELECT * FROM isp_devices WHERE 1=1";
		const binds: string[] = [];
		if (data.query.subscriber_id) {
			query += " AND subscriber_id = ?";
			binds.push(data.query.subscriber_id);
		}
		if (data.query.device_type) {
			query += " AND device_type = ?";
			binds.push(data.query.device_type);
		}
		if (data.query.mesh_enabled) {
			query += " AND mesh_enabled = ?";
			binds.push(data.query.mesh_enabled);
		}
		query += " ORDER BY registered_at DESC LIMIT 100";

		const stmt = binds.length > 0 ? db.prepare(query).bind(...binds) : db.prepare(query);
		const rows = await stmt.all();

		return { success: true as const, devices: rows.results || [], total: rows.results?.length || 0 };
	}
}

// ═══ ISP Device Register ═══
export class IspDeviceRegister extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "Register a customer device (router, smart device, phone, etc.)",
		operationId: "isp-device-register",
		request: {
			body: contentJson(
				z.object({
					device_id: z.string().describe("Unique device ID"),
					subscriber_id: z.string().optional().describe("Owner subscriber ID"),
					device_type: z.string().describe("Type: router, access_point, smart_hub, smart_camera, phone, etc."),
					manufacturer: z.string().optional(),
					model: z.string().optional(),
					mac_address: z.string().optional(),
					mesh_enabled: z.boolean().optional().describe("Enable mesh networking on this device"),
					is_mesh_tower: z.boolean().optional().describe("Flash as mesh tower (router firmware update)"),
				}),
			),
		},
		responses: {
			"200": {
				description: "Device registered",
				...contentJson(
					z.object({
						success: z.literal(true),
						device_id: z.string(),
						mesh_node_id: z.string().optional(),
						firmware_status: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const body = data.body;
		const db = c.env.DB;

		const meshNodeId = body.mesh_enabled ? `mesh-${body.device_id}` : null;

		await db
			.prepare(
				`INSERT OR REPLACE INTO isp_devices
				 (device_id, subscriber_id, device_type, manufacturer, model, mac_address,
				  mesh_enabled, mesh_node_id, is_mesh_tower, firmware_status, status, registered_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', datetime('now'))`,
			)
			.bind(
				body.device_id,
				body.subscriber_id || null,
				body.device_type,
				body.manufacturer || null,
				body.model || null,
				body.mac_address || null,
				body.mesh_enabled ? 1 : 0,
				meshNodeId,
				body.is_mesh_tower ? 1 : 0,
				body.is_mesh_tower ? "update_available" : "unknown",
			)
			.run();

		// If mesh-enabled, also register as a mesh node
		if (body.mesh_enabled && meshNodeId) {
			await db
				.prepare(
					`INSERT OR REPLACE INTO mesh_nodes
					 (node_id, hardware, region, status, connected_at, role, device_type)
					 VALUES (?, ?, 'auto-detect', 'connected', datetime('now'), ?, ?)`,
				)
				.bind(
					meshNodeId,
					body.manufacturer && body.model ? `${body.manufacturer} ${body.model}` : body.device_type,
					body.is_mesh_tower ? "tower" : "relay",
					body.device_type,
				)
				.run();
		}

		return {
			success: true as const,
			device_id: body.device_id,
			mesh_node_id: meshNodeId || undefined,
			firmware_status: body.is_mesh_tower ? "update_available" : "unknown",
		};
	}
}

// ═══ ISP Firmware ═══
export class IspFirmwareList extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "List available firmware images for mesh tower/router flash",
		operationId: "isp-firmware-list",
		request: {
			query: z.object({
				device_type: z.string().optional(),
				status: z.string().optional().describe("Filter: stable, beta, nightly"),
			}),
		},
		responses: {
			"200": {
				description: "Available firmware images",
				...contentJson(
					z.object({
						success: z.literal(true),
						firmware: z.array(z.any()),
						total: z.number(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const db = c.env.DB;

		let query = "SELECT * FROM isp_firmware WHERE 1=1";
		const binds: string[] = [];
		if (data.query.device_type) {
			query += " AND device_type = ?";
			binds.push(data.query.device_type);
		}
		if (data.query.status) {
			query += " AND status = ?";
			binds.push(data.query.status);
		}
		query += " ORDER BY release_date DESC";

		const stmt = binds.length > 0 ? db.prepare(query).bind(...binds) : db.prepare(query);
		const rows = await stmt.all();

		const firmware = (rows.results || []).map((r: any) => ({
			...r,
			features: r.features ? JSON.parse(r.features) : [],
		}));

		return { success: true as const, firmware, total: firmware.length };
	}
}

// ═══ ISP Cellular Data ═══
export class IspCellularList extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "List cellular data subscriptions with usage",
		operationId: "isp-cellular-list",
		request: {
			query: z.object({
				subscriber_id: z.string().optional(),
				status: z.string().optional(),
			}),
		},
		responses: {
			"200": {
				description: "Cellular subscriptions",
				...contentJson(
					z.object({
						success: z.literal(true),
						cellular: z.array(z.any()),
						total: z.number(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const db = c.env.DB;

		let query = "SELECT * FROM isp_cellular WHERE 1=1";
		const binds: string[] = [];
		if (data.query.subscriber_id) {
			query += " AND subscriber_id = ?";
			binds.push(data.query.subscriber_id);
		}
		if (data.query.status) {
			query += " AND status = ?";
			binds.push(data.query.status);
		}
		query += " ORDER BY activated_at DESC LIMIT 100";

		const stmt = binds.length > 0 ? db.prepare(query).bind(...binds) : db.prepare(query);
		const rows = await stmt.all();

		return { success: true as const, cellular: rows.results || [], total: rows.results?.length || 0 };
	}
}

// ═══ ISP Cellular Provision ═══
export class IspCellularProvision extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "Provision a new cellular data subscription (5G/4G via Open5GS)",
		operationId: "isp-cellular-provision",
		request: {
			body: contentJson(
				z.object({
					subscriber_id: z.string().describe("Subscriber ID"),
					plan_type: z.string().describe("Plan: data_5gb, data_25gb, data_unlimited, voice_data, business_cellular"),
					sim_type: z.string().optional().describe("SIM type: physical, esim, virtual. Defaults to esim."),
					network_type: z.string().optional().describe("Network: 5g_sa, 5g_nsa, 4g_lte. Defaults to 5g_sa."),
				}),
			),
		},
		responses: {
			"200": {
				description: "Cellular subscription provisioned",
				...contentJson(
					z.object({
						success: z.literal(true),
						cellular_id: z.string(),
						imsi: z.string(),
						iccid: z.string(),
						msisdn: z.string(),
						apn: z.string(),
						plan_type: z.string(),
						network_type: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const body = data.body;
		const db = c.env.DB;

		const cellularId = `cell-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		const imsi = `999700${Date.now().toString().slice(-9)}`;
		const iccid = `89997${Date.now().toString().slice(-14)}${Math.floor(Math.random() * 10)}`;
		const msisdn = `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`;

		const planPrices: Record<string, number> = {
			data_5gb: 19.99,
			data_25gb: 39.99,
			data_unlimited: 59.99,
			voice_data: 49.99,
			business_cellular: 79.99,
		};

		const planCaps: Record<string, number> = {
			data_5gb: 5.0,
			data_25gb: 25.0,
			data_unlimited: -1,
			voice_data: 50.0,
			business_cellular: -1,
		};

		await db
			.prepare(
				`INSERT INTO isp_cellular
				 (cellular_id, subscriber_id, imsi, iccid, msisdn, sim_type, plan_type,
				  data_cap_gb, monthly_cost, network_type, apn, plmn, status, activated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'darcloud.isp', '99970', 'active', datetime('now'))`,
			)
			.bind(
				cellularId,
				body.subscriber_id,
				imsi,
				iccid,
				msisdn,
				body.sim_type || "esim",
				body.plan_type,
				planCaps[body.plan_type] || 5.0,
				planPrices[body.plan_type] || 19.99,
				body.network_type || "5g_sa",
			)
			.run();

		return {
			success: true as const,
			cellular_id: cellularId,
			imsi,
			iccid,
			msisdn,
			apn: "darcloud.isp",
			plan_type: body.plan_type,
			network_type: body.network_type || "5g_sa",
		};
	}
}

// ═══ ISP Service Areas ═══
export class IspServiceAreas extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "List ISP service/coverage areas",
		operationId: "isp-service-areas",
		responses: {
			"200": {
				description: "Coverage areas",
				...contentJson(
					z.object({
						success: z.literal(true),
						areas: z.array(z.any()),
						total: z.number(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;
		const rows = await db.prepare("SELECT * FROM isp_service_areas ORDER BY name").all();
		return { success: true as const, areas: rows.results || [], total: rows.results?.length || 0 };
	}
}

// ═══ ISP Dashboard ═══
export class IspDashboard extends OpenAPIRoute {
	public schema = {
		tags: ["ISP"],
		summary: "ISP operations dashboard — subscribers, revenue, devices, coverage",
		operationId: "isp-dashboard",
		responses: {
			"200": {
				description: "ISP dashboard data",
				...contentJson(
					z.object({
						success: z.literal(true),
						isp: z.any(),
						subscribers: z.any(),
						devices: z.any(),
						cellular: z.any(),
						mesh: z.any(),
						revenue: z.any(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;

		const [subCount, deviceCount, cellCount, meshCount, towerCount, areaCount] = await Promise.all([
			db.prepare("SELECT COUNT(*) as cnt FROM telecom_subscribers WHERE status = 'active'").first<{ cnt: number }>(),
			db.prepare("SELECT COUNT(*) as cnt FROM isp_devices WHERE status = 'online'").first<{ cnt: number }>(),
			db.prepare("SELECT COUNT(*) as cnt FROM isp_cellular WHERE status = 'active'").first<{ cnt: number }>(),
			db.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes WHERE status IN ('connected','online')").first<{ cnt: number }>(),
			db.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes WHERE role = 'tower'").first<{ cnt: number }>(),
			db.prepare("SELECT COUNT(*) as cnt FROM isp_service_areas WHERE status = 'active'").first<{ cnt: number }>(),
		]);

		const subs = subCount?.cnt || 0;
		const cells = cellCount?.cnt || 0;

		return {
			success: true as const,
			isp: {
				name: "DarCloud ISP™",
				network: "FungiMesh + Open5GS 5G SA",
				plmn: "999-70",
				core: "Open5GS 2.7.2",
				status: "operational",
			},
			subscribers: { active: subs },
			devices: { online: deviceCount?.cnt || 0 },
			cellular: { active: cells },
			mesh: {
				nodes_online: meshCount?.cnt || 0,
				towers: towerCount?.cnt || 0,
				service_areas: areaCount?.cnt || 0,
			},
			revenue: {
				note: "Revenue split: 30% Founder, 40% AI Validators, 10% Hardware Hosts, 18% Ecosystem, 2% Zakat",
			},
		};
	}
}
