import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_USER = {
	name: "Test User",
	email: `test_${Date.now()}@darcloud.host`,
	password: "securePassword123",
	plan: "starter",
};

let ipCounter = 0;
function uniqueIp() {
	return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter++ % 256}`;
}

async function signup(data?: Partial<typeof TEST_USER>) {
	const payload = { ...TEST_USER, ...data };
	return SELF.fetch("http://local.test/api/auth/signup", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Forwarded-For": uniqueIp(),
		},
		body: JSON.stringify(payload),
	});
}

async function login(email?: string, password?: string) {
	return SELF.fetch("http://local.test/api/auth/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Forwarded-For": uniqueIp(),
		},
		body: JSON.stringify({
			email: email || TEST_USER.email,
			password: password || TEST_USER.password,
		}),
	});
}

describe("Auth API Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── Signup ──
	describe("POST /api/auth/signup", () => {
		it("should create a new user and return JWT token", async () => {
			const email = `signup_${Date.now()}@darcloud.host`;
			const res = await signup({ email });
			const body = await res.json<{
				success: boolean;
				user: { email: string; name: string; plan: string };
				token: string;
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.user.email).toBe(email.toLowerCase());
			expect(body.user.name).toBe(TEST_USER.name);
			expect(body.user.plan).toBe("starter");
			expect(body.token).toBeTruthy();
			expect(body.token.split(".")).toHaveLength(3);
		});

		it("should reject signup with missing fields", async () => {
			const res = await SELF.fetch("http://local.test/api/auth/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({ email: "test@test.com" }),
			});

			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain("required");
		});

		it("should reject short passwords", async () => {
			const res = await signup({
				password: "short",
				email: `short_${Date.now()}@test.com`,
			});
			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain("8 characters");
		});

		it("should reject invalid email format", async () => {
			const res = await signup({ email: "notanemail" });
			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain("email");
		});

		it("should reject duplicate signup", async () => {
			const email = `dup_${Date.now()}@darcloud.host`;
			await signup({ email });
			const res = await signup({ email });
			expect(res.status).toBe(409);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain("already exists");
		});
	});

	// ── Login ──
	describe("POST /api/auth/login", () => {
		it("should login with valid credentials and return JWT", async () => {
			const email = `login_${Date.now()}@darcloud.host`;
			await signup({ email });

			const res = await login(email, TEST_USER.password);
			const body = await res.json<{
				success: boolean;
				user: { email: string };
				token: string;
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.user.email).toBe(email.toLowerCase());
			expect(body.token).toBeTruthy();
			expect(body.token.split(".")).toHaveLength(3);
		});

		it("should reject login with wrong password", async () => {
			const email = `wrongpw_${Date.now()}@darcloud.host`;
			await signup({ email });

			const res = await login(email, "wrongPassword123");
			expect(res.status).toBe(401);
		});

		it("should reject login for non-existent user", async () => {
			const res = await login("nonexistent@darcloud.host", "password123");
			expect(res.status).toBe(401);
		});
	});

	// ── JWT Protected Endpoints ──
	describe("GET /api/auth/me", () => {
		it("should return user info with valid token", async () => {
			const email = `me_${Date.now()}@darcloud.host`;
			const signupRes = await signup({ email });
			const { token } = await signupRes.json<{ token: string }>();

			const res = await SELF.fetch("http://local.test/api/auth/me", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const body = await res.json<{
				success: boolean;
				user: { email: string; name: string };
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.user.email).toBe(email.toLowerCase());
		});

		it("should reject request without auth header", async () => {
			const res = await SELF.fetch("http://local.test/api/auth/me");
			expect(res.status).toBe(401);
		});

		it("should reject request with invalid token", async () => {
			const res = await SELF.fetch("http://local.test/api/auth/me", {
				headers: { Authorization: "Bearer invalid.token.here" },
			});
			expect(res.status).toBe(401);
		});
	});

	// ── Admin Stats ──
	describe("GET /api/admin/stats", () => {
		it("should return stats with valid token", async () => {
			const email = `admin_${Date.now()}@darcloud.host`;
			const signupRes = await signup({ email });
			const { token } = await signupRes.json<{ token: string }>();

			const res = await SELF.fetch("http://local.test/api/admin/stats", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const body = await res.json<{
				success: boolean;
				stats: {
					users: number;
					contact_submissions: number;
					hwc_applications: number;
				};
			}>();

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.stats.users).toBeGreaterThanOrEqual(1);
			expect(typeof body.stats.contact_submissions).toBe("number");
			expect(typeof body.stats.hwc_applications).toBe("number");
		});

		it("should reject admin stats without auth", async () => {
			const res = await SELF.fetch("http://local.test/api/admin/stats");
			expect(res.status).toBe(401);
		});
	});

	// ── HTML Pages ──
	describe("HTML Page Routes", () => {
		it("should serve signup page", async () => {
			const res = await SELF.fetch("http://local.test/signup");
			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain("DarCloud");
		});

		it("should serve login page", async () => {
			const res = await SELF.fetch("http://local.test/login");
			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain("DarCloud");
		});

		it("should serve dashboard page", async () => {
			const res = await SELF.fetch("http://local.test/dashboard");
			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain("Dashboard");
		});

		it("should serve admin page", async () => {
			const res = await SELF.fetch("http://local.test/admin");
			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain("Admin");
		});
	});
});
