import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../../src/index";

function trappedEnvironment() {
	let touched = false;
	const database = new Proxy({} as D1Database, {
		get() {
			touched = true;
			throw new Error("A retired account route attempted to access D1");
		},
	});
	return {
		bindings: { DB: database } as Env,
		wasTouched: () => touched,
	};
}

const accountPaths = [
	"/api/auth/signup",
	"/api/auth/login",
	"/api/auth/me",
	"/api/auth/logout",
	"/api/auth/session",
];

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

describe("retired DarCloud account system", () => {
	it("fails closed for every account path and method without touching D1", async () => {
		const trap = trappedEnvironment();

		for (const path of accountPaths) {
			for (const method of methods) {
				const response = await app.request(
					`http://local.test${path}`,
					{
						method,
						headers: {
							"Content-Type": "application/json",
							Authorization: "Bearer attacker.supplied.token",
							Cookie: "darcloud_session=attacker.supplied.token",
						},
						...(method === "GET"
							? {}
							: {
								body: JSON.stringify({
									email: "person@example.com",
									password: "must-not-be-read",
								}),
							}),
					},
					trap.bindings,
				);
				expect(response.status, `${method} ${path}`).toBe(410);
				expect(await response.json(), `${method} ${path}`).toMatchObject({
					accounts_enabled: false,
					registration_enabled: false,
					authentication_enabled: false,
				});
			}
		}

		expect(trap.wasTouched()).toBe(false);
	});

	it("rejects a cross-origin simple account write before routing", async () => {
		const response = await SELF.fetch(
			"http://local.test/api/auth/login",
			{
				method: "POST",
				headers: {
					Origin: "https://evil.example",
					"Content-Type": "text/plain",
				},
				body: JSON.stringify({ email: "person@example.com" }),
			},
		);
		expect(response.status).toBe(403);
		expect(response.headers.get("access-control-allow-origin")).toBeNull();
	});

	it("retires account lookup and administrator APIs without touching D1", async () => {
		const trap = trappedEnvironment();

		for (const path of [
			"/api/lookup?email=someone%40example.com",
			"/api/admin/stats",
			"/api/onboarding/status/anyone%40example.com",
		]) {
			const response = await app.request(
				`http://local.test${path}`,
				{},
				trap.bindings,
			);
			expect(response.status, path).toBe(410);
			expect(await response.text(), path).not.toContain("password_hash");
		}

		expect(trap.wasTouched()).toBe(false);
	});

	describe("HTML account pages", () => {
		for (const path of ["/signup", "/login", "/dashboard", "/admin"]) {
			it(`serves a non-interactive 410 notice at ${path}`, async () => {
				const response = await SELF.fetch(`http://local.test${path}`);
				expect(response.status).toBe(410);
				const html = await response.text();
				expect(html).toContain("unavailable");
				expect(html).not.toContain("type=\"password\"");
				expect(html).not.toContain("/api/auth/login");
			});
		}
	});
});
