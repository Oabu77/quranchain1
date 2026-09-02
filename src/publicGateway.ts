import publicEntry from "./publicEntry";
import { handleSubdomain } from "./subdomainRouter";
import type { PublicBindings } from "./public/types";

type PublicWorker = {
  fetch(request: Request, env: PublicBindings, ctx: ExecutionContext): Response | Promise<Response>;
};

const worker = publicEntry as unknown as PublicWorker;

function isAllowedOrigin(origin: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.)?darcloud\.(host|net)$/i.test(origin);
}

function isAllowedReadOnlySubdomainApi(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const url = new URL(request.url);
  const aiHost = /^(ai)\.darcloud\.(host|net)$/i.test(url.hostname);
  const meshHost = /^(mesh)\.darcloud\.(host|net)$/i.test(url.hostname);

  if (aiHost) {
    return (
      url.pathname === "/api/fleet" ||
      url.pathname === "/api/assistants" ||
      /^\/api\/agent\/[a-z0-9_-]{1,64}$/i.test(url.pathname)
    );
  }

  if (meshHost) {
    return url.pathname === "/api/status" || url.pathname === "/api/nodes";
  }

  return false;
}

function secureReadOnlyApiResponse(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("origin") || "";
  for (const name of [
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-allow-methods",
    "access-control-allow-headers",
  ]) {
    headers.delete(name);
  }
  if (origin) headers.set("Vary", "Origin");
  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("Cache-Control", "no-store");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: PublicBindings, ctx: ExecutionContext): Promise<Response> {
    if (isAllowedReadOnlySubdomainApi(request)) {
      const response = await handleSubdomain(request);
      if (response) return secureReadOnlyApiResponse(response, request);
    }
    return worker.fetch(request, env, ctx);
  },
};
