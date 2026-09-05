const MIN_CONTROL_TOKEN_LENGTH = 32;

export type BackupAuthorizationResult =
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

export async function authorizeBackupRequest(
  method: string,
  authorizationHeader: string | undefined,
  readTokenValue: unknown,
  mutationTokenValue: unknown,
): Promise<BackupAuthorizationResult> {
  const readToken = configuredToken(readTokenValue);
  const mutationToken = configuredToken(mutationTokenValue);

  if (!readToken || !mutationToken) {
    return {
      ok: false,
      status: 503,
      error: "Backup registry authorization is not configured",
    };
  }

  if (await secureEqual(readToken, mutationToken)) {
    return {
      ok: false,
      status: 503,
      error: "Backup registry read and mutation credentials must be distinct",
    };
  }

  const supplied = bearerToken(authorizationHeader);
  if (!supplied) {
    return { ok: false, status: 401, error: "Authorization required" };
  }

  const isRead = method === "GET" || method === "HEAD";
  if (isRead) {
    if (await secureEqual(supplied, readToken)) {
      return { ok: true, scope: "read" };
    }
    if (await secureEqual(supplied, mutationToken)) {
      return { ok: true, scope: "mutation" };
    }
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (!(await secureEqual(supplied, mutationToken))) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, scope: "mutation" };
}
