import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

/**
 * Mesh Coordinator — the critical missing piece.
 * Returns WireGuard peer configs for a requesting node so nodes can
 * actually establish encrypted tunnels to each other.
 */
export class MeshPeers extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "Get WireGuard peer configs for a mesh node (coordinator endpoint)",
		description:
			"The mesh coordinator reads all registered nodes from D1 and returns " +
			"WireGuard [Peer] configuration blocks for every OTHER node in the mesh. " +
			"This is the missing link that lets nodes actually connect to each other. " +
			"Each peer entry includes the public key, endpoint, and allowed mesh IP.",
		operationId: "mesh-peers-get",
		request: {
			params: z.object({
				nodeId: z.string().describe("The requesting node's ID"),
			}),
		},
		responses: {
			"200": {
				description: "Peer configs for the requesting node",
				...contentJson(
					z.object({
						success: z.literal(true),
						node_id: z.string(),
						peers: z.array(
							z.object({
								node_id: z.string(),
								wireguard_pubkey: z.string(),
								endpoint: z.string(),
								allowed_ips: z.string(),
								role: z.string(),
							}),
						),
						total_peers: z.number(),
						fetched_at: z.string(),
					}),
				),
			},
			"404": {
				description: "Requesting node not found in mesh",
				...contentJson(z.object({ success: z.literal(false), error: z.string() })),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const nodeId = data.params.nodeId;
		const db = c.env.DB;

		// Verify the requesting node exists
		const self = await db
			.prepare("SELECT node_id, wireguard_pubkey FROM mesh_nodes WHERE node_id = ?")
			.bind(nodeId)
			.first<{ node_id: string; wireguard_pubkey: string }>();

		if (!self) {
			return Response.json({ success: false, error: "Node not registered" }, { status: 404 });
		}

		// Get all OTHER nodes that have a wireguard pubkey and endpoint
		const rows = await db
			.prepare(
				`SELECT node_id, wireguard_pubkey, wireguard_endpoint, mesh_ip, role, listen_port
				 FROM mesh_nodes
				 WHERE node_id != ? AND wireguard_pubkey != '' AND wireguard_pubkey IS NOT NULL
				 ORDER BY node_id`,
			)
			.bind(nodeId)
			.all<{
				node_id: string;
				wireguard_pubkey: string;
				wireguard_endpoint: string;
				mesh_ip: string;
				role: string;
				listen_port: number;
			}>();

		const peers = (rows.results || []).map((r) => ({
			node_id: r.node_id,
			wireguard_pubkey: r.wireguard_pubkey,
			endpoint: r.wireguard_endpoint
				? `${r.wireguard_endpoint}:${r.listen_port || 51820}`
				: "",
			allowed_ips: r.mesh_ip ? `${r.mesh_ip}/32` : "10.0.0.0/24",
			role: r.role || "relay",
		}));

		return {
			success: true as const,
			node_id: nodeId,
			peers,
			total_peers: peers.length,
			fetched_at: new Date().toISOString(),
		};
	}
}

/**
 * Full mesh topology — returns all nodes and their connectivity for visualization
 */
export class MeshTopology extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "Get full mesh network topology for visualization",
		operationId: "mesh-topology",
		responses: {
			"200": {
				description: "Complete mesh topology",
				...contentJson(
					z.object({
						success: z.literal(true),
						nodes: z.array(
							z.object({
								node_id: z.string(),
								hardware: z.string(),
								region: z.string(),
								role: z.string(),
								device_type: z.string(),
								status: z.string(),
								has_wireguard: z.boolean(),
								mesh_ip: z.string(),
							}),
						),
						total: z.number(),
						online: z.number(),
						towers: z.number(),
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
				`SELECT node_id, hardware, region, role, device_type, status,
				        wireguard_pubkey, mesh_ip, last_heartbeat
				 FROM mesh_nodes ORDER BY region, node_id`,
			)
			.all<{
				node_id: string;
				hardware: string;
				region: string;
				role: string;
				device_type: string;
				status: string;
				wireguard_pubkey: string;
				mesh_ip: string;
				last_heartbeat: string;
			}>();

		const nodes = (rows.results || []).map((r) => ({
			node_id: r.node_id,
			hardware: r.hardware || "unknown",
			region: r.region || "auto-detect",
			role: r.role || "relay",
			device_type: r.device_type || "linux",
			status: r.status || "offline",
			has_wireguard: !!(r.wireguard_pubkey && r.wireguard_pubkey !== ""),
			mesh_ip: r.mesh_ip || "",
		}));

		const online = nodes.filter((n) => n.status === "connected" || n.status === "online").length;
		const towers = nodes.filter((n) => n.role === "tower" || n.role === "gateway").length;

		return {
			success: true as const,
			nodes,
			total: nodes.length,
			online,
			towers,
			fetched_at: new Date().toISOString(),
		};
	}
}
