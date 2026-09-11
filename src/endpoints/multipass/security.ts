const MIN_CONTROL_TOKEN_LENGTH = 32;

export const VM_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/;

export type MultipassAuthorizationResult =
  | { ok: true; scope: "read" | "mutation" }
  | { ok: false; status: 401 | 403 | 503; error: string };

function configuredToken(value: unknown): string | null {
  return typeof value === "string" && value.length >= MIN_CONTROL_TOKEN_LENGTH
    ? value
    : null;
}

function bearerToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function digest(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function secureEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    mismatch |= (a[i] || 0) ^ (b[i] || 0);
  }
  return mismatch === 0;
}

export function isSafeVmName(value: string): boolean {
  return value.length >= 3 && value.length <= 64 && VM_NAME_PATTERN.test(value);
}

export async function authorizeMultipassRequest(
  method: string,
  authorizationHeader: string | undefined,
  readTokenValue: unknown,
  mutationTokenValue: unknown,
): Promise<MultipassAuthorizationResult> {
  const readToken = configuredToken(readTokenValue);
  const mutationToken = configuredToken(mutationTokenValue);
  const isRead = method === "GET" || method === "HEAD";
  const expected = isRead ? readToken : mutationToken;

  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: isRead
        ? "Multipass read authorization is not configured"
        : "Multipass mutation authorization is not configured",
    };
  }

  const supplied = bearerToken(authorizationHeader);
  if (!supplied) {
    return { ok: false, status: 401, error: "Authorization required" };
  }

  if (!(await secureEqual(supplied, expected))) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, scope: isRead ? "read" : "mutation" };
}
