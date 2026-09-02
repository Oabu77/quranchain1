import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

type PageCase = {
	name: string;
	url: string;
	markers: string[];
	contentType?: string;
};

const subdomainPages: PageCase[] = [
	{ name: "www", url: "https://www.darcloud.host/", markers: ["DarCloud"] },
	{ name: "AI", url: "https://ai.darcloud.host/", markers: ["AI"] },
	{ name: "API gateway", url: "https://api-gateway.darcloud.host/", markers: ["API"] },
	{ name: "blockchain", url: "https://blockchain.darcloud.host/", markers: ["Blockchain", "QuranChain"] },
	{ name: "checkout", url: "https://checkout.darcloud.host/", markers: ["Checkout", "Payment", "Plans"] },
	{ name: "commerce", url: "https://commerce.darcloud.host/", markers: ["Commerce", "Marketplace"] },
	{ name: "DeFi", url: "https://defi.darcloud.host/", markers: ["DeFi", "Finance"] },
	{ name: "education", url: "https://edu.darcloud.host/", markers: ["Education", "Learning"] },
	{ name: "energy", url: "https://energy.darcloud.host/", markers: ["Energy", "Grid"] },
	{ name: "health", url: "https://health.darcloud.host/", markers: ["Health", "Care"] },
	{ name: "HR", url: "https://hr.darcloud.host/", markers: ["Human", "HR", "Workforce"] },
	{ name: "law", url: "https://law.darcloud.host/", markers: ["Law", "Legal"] },
	{ name: "media", url: "https://media.darcloud.host/", markers: ["Media", "Content"] },
	{ name: "community", url: "https://community.darcloud.host/", markers: ["Dar Al-Nas", "Community"] },
	{ name: "Dar Al-Nas alias", url: "https://darnas.darcloud.host/", markers: ["Dar Al-Nas", "Community"] },
	{ name: "pay", url: "https://pay.darcloud.host/", markers: ["DarPay", "Payment"] },
	{ name: "security", url: "https://security.darcloud.host/", markers: ["Security", "Protection"] },
	{ name: "telecom", url: "https://telecom.darcloud.host/", markers: ["Telecom", "Network"] },
	{ name: "trade", url: "https://trade.darcloud.host/", markers: ["Trade", "Commerce"] },
	{ name: "transport", url: "https://transport.darcloud.host/", markers: ["Transport", "Mobility"] },
	{ name: "enterprise", url: "https://enterprise.darcloud.host/", markers: ["Enterprise", "Business"] },
	{ name: "HWC", url: "https://hwc.darcloud.host/", markers: ["Wealth", "HWC"] },
	{ name: "HWC alias", url: "https://halalwealthclub.darcloud.host/", markers: ["Wealth", "HWC"] },
	{ name: "mesh", url: "https://mesh.darcloud.host/", markers: ["Mesh", "Network"] },
	{ name: "MeshTalk", url: "https://meshtalk.darcloud.host/", markers: ["MeshTalk", "Fungi"] },
	{ name: "FungiOS alias", url: "https://fungios.darcloud.host/", markers: ["MeshTalk", "Fungi"] },
	{ name: "real estate", url: "https://realestate.darcloud.host/", markers: ["Real Estate", "realestate", "Property"] },
	{ name: "revenue", url: "https://revenue.darcloud.host/", markers: ["Revenue", "revenue"] },
	{ name: "Omar AI", url: "https://omarai.darcloud.host/", markers: ["Omar AI", "OmarAI", "Assistant"] },
];

const apexPages: PageCase[] = [
	{ name: "signup", url: "https://darcloud.host/signup", markers: ["Sign Up", "Create Account"], contentType: "text/html" },
	{ name: "login", url: "https://darcloud.host/login", markers: ["Login", "Sign In"], contentType: "text/html" },
	{ name: "onboarding", url: "https://darcloud.host/onboarding", markers: ["Onboarding", "Welcome", "Setup"], contentType: "text/html" },
	{ name: "dashboard", url: "https://darcloud.host/dashboard", markers: ["Dashboard"], contentType: "text/html" },
	{ name: "admin", url: "https://darcloud.host/admin", markers: ["Admin"], contentType: "text/html" },
	{ name: "checkout success", url: "https://darcloud.host/checkout/success", markers: ["Success", "Payment", "Checkout"], contentType: "text/html" },
	{ name: "checkout cancel", url: "https://darcloud.host/checkout/cancel", markers: ["Cancel", "Checkout", "Payment"], contentType: "text/html" },
	{ name: "checkout plan", url: "https://darcloud.host/checkout/pro", markers: ["Checkout", "Professional", "Pro"], contentType: "text/html" },
	{ name: "privacy", url: "https://darcloud.host/privacy", markers: ["Privacy"], contentType: "text/html" },
	{ name: "privacy alias", url: "https://darcloud.host/privacy-policy", markers: ["Privacy"], contentType: "text/html" },
	{ name: "terms", url: "https://darcloud.host/terms", markers: ["Terms"], contentType: "text/html" },
];

function containsExpectedMarker(body: string, markers: string[]): boolean {
	const normalized = body.toLowerCase();
	return markers.some((marker) => normalized.includes(marker.toLowerCase()));
}

async function assertPage(page: PageCase): Promise<void> {
	const response = await SELF.fetch(page.url, { redirect: "manual" });
	const body = await response.text();

	expect(response.status, `${page.name} returned ${response.status}: ${body.slice(0, 200)}`).toBe(200);
	expect(body.length, `${page.name} body is empty`).toBeGreaterThan(20);
	expect(
		containsExpectedMarker(body, page.markers),
		`${page.name} did not contain any expected marker: ${page.markers.join(", ")}; body=${body.slice(0, 300)}`,
	).toBe(true);
	if (page.contentType) {
		expect(response.headers.get("content-type") || "").toContain(page.contentType);
	}
}

describe("DarCloud public page contract", () => {
	it("redirects the apex home page to the canonical www landing page", async () => {
		const response = await SELF.fetch("https://darcloud.host/", { redirect: "manual" });
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("https://www.darcloud.host/");
	});

	for (const page of subdomainPages) {
		it(`renders ${page.name}`, async () => {
			await assertPage(page);
		});
	}

	for (const page of apexPages) {
		it(`renders ${page.name}`, async () => {
			await assertPage(page);
		});
	}
});
