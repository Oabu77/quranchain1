import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

let requestCounter = 1;

async function createUser(prefix: string) {
	const suffix = `${Date.now()}_${requestCounter++}`;
	const email = `${prefix}_${suffix}@example.com`;
	const password = "Correct Horse Battery 123!";
	const response = await SELF.fetch("http://local.test/api/auth/signup", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Forwarded-For": `10.22.0.${requestCounter}`,
		},
		body: JSON.stringify({ name: prefix, email, password, plan: "starter" }),
	});
	expect(response.status).toBe(200);
	const body = await response.json<{ token: string }>();
	const payload = JSON.parse(
		atob(body.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
	) as { sub: number };
	return { email, token: body.token, userId: payload.sub };
}

function authenticated(token: string, init: RequestInit = {}): RequestInit {
	return {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
	};
}

describe("Messaging API", () => {
	it("creates a direct conversation and exchanges a text message", async () => {
		const alice = await createUser("Alice");
		const bob = await createUser("Bob");

		const createResponse = await SELF.fetch(
			"http://local.test/messaging/conversations",
			authenticated(alice.token, {
				method: "POST",
				body: JSON.stringify({ type: "direct", participants: [bob.userId] }),
			}),
		);
		expect(createResponse.status).toBe(201);
		const created = await createResponse.json<{ conversation_id: number }>();

		const sendResponse = await SELF.fetch(
			`http://local.test/messaging/conversations/${created.conversation_id}/messages`,
			authenticated(alice.token, {
				method: "POST",
				body: JSON.stringify({ content: "Assalamu alaikum" }),
			}),
		);
		expect(sendResponse.status).toBe(201);

		const readResponse = await SELF.fetch(
			`http://local.test/messaging/conversations/${created.conversation_id}/messages`,
			authenticated(bob.token),
		);
		expect(readResponse.status).toBe(200);
		const read = await readResponse.json<{ messages: Array<{ content: string }> }>();
		expect(read.messages.some((message) => message.content === "Assalamu alaikum")).toBe(true);
	});

	it("does not allow a nonparticipant to read a conversation", async () => {
		const alice = await createUser("AlicePrivate");
		const bob = await createUser("BobPrivate");
		const outsider = await createUser("Outsider");
		const createResponse = await SELF.fetch(
			"http://local.test/messaging/conversations",
			authenticated(alice.token, {
				method: "POST",
				body: JSON.stringify({ type: "direct", participants: [bob.userId] }),
			}),
		);
		const created = await createResponse.json<{ conversation_id: number }>();
		const response = await SELF.fetch(
			`http://local.test/messaging/conversations/${created.conversation_id}/messages`,
			authenticated(outsider.token),
		);
		expect(response.status).toBe(403);
	});
});
