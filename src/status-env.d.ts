declare namespace Cloudflare {
  interface Env {
    /** Exact HTTPS endpoint outside this Worker's wildcard routes. */
    CHAIN_STATUS_URL?: string;
    /** Secret shared only with the read-only bot status endpoint. */
    CHAIN_STATUS_TOKEN?: string;
    /** Comma-separated existing numeric user IDs granted administrative access. */
    ADMIN_USER_IDS?: string;
  }
}
