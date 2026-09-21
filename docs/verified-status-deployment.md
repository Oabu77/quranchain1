# Verified-data status patch and deployment plan

Status: prepared for review; not deployed.

Source inspected: `Oabu77/quranchain1`, baseline commit
`15ea881fdfac440aaab7a972f85eae84b98f87a7`. The implementation uses the existing
`src/index.ts` entry point and does not introduce a replacement Worker.

## What the repository actually contains

The QuranChain Discord bot reads a SQLite database at
`quranchain-bot/quranchain.db`, through `quranchain-bot/database.js`.
`shared/bot-ipc.js` listens on `127.0.0.1:9002` for this bot. Its existing
`/chain-stats` handler mixes stored counts with fixed network/validator metrics;
it is not an appropriate public data contract. Other IPC routes expose private
member information or perform mutations and must remain private.

This patch adds an authenticated, GET-only `/chain-status` projection to that
same loopback server. It reads block and transaction counts and the latest
record in one SQLite SELECT. It exports no wallet identities, balances,
transaction contents, revenue, or hash claims. The bot starts its IPC listener
only after its Discord client becomes ready.

The existing mining module contains a random hash fallback, and transaction
hashes are generated identifiers. Stored rows therefore cannot establish
verified public-chain consensus or external network activity. This patch
does not repair or certify the underlying mining/consensus design.

## Public contract

| Route | Behavior |
| --- | --- |
| `GET /api/chain/status` | Whitelisted projection of the configured ledger observation |
| Blockchain subdomains: `GET /health` | Same ledger status contract |
| Blockchain subdomains: `/`, `/explorer` | Observation UI with automatic stale expiry; no generated blocks or transactions |
| Undefined blockchain `/api/*` | 404; no arbitrary proxy |
| Apex `GET /health` | D1 observation and explicitly unknown unmeasured fleet services |
| `/api/admin/stats`, `/api/revenue/*`, `/api/contracts/*` | Existing authenticated user in the operator's `ADMIN_USER_IDS` allowlist |
| `POST /api/checkout/session` | Signed-in D1 user, server-owned Stripe customer mapping, real Stripe Checkout session; no paid-plan activation from an intent |
| `POST /api/stripe/portal` | Authenticated owner of the stored Stripe customer ID |
| Checkout subdomains | GET redirects to the existing canonical checkout pages; no generated session IDs or payment-success response |
| Revenue landing `/` | Informational JSON metadata; no fabricated metrics or financial proxy |

Fresh observations return HTTP 200 with source, `observed_at`, `fetched_at`,
age, and the observed data. Observations older than 60 seconds return HTTP 503
and `status: stale`, retaining their original timestamp and clearly historical
data. Absent configuration returns HTTP 503 with `data: null`. Invalid data,
redirects, upstream errors, and timeouts return HTTP 502 with no invented
fallback. Responses use `Cache-Control: no-store`.

An old latest-block timestamp does not by itself make a new database read
stale. The UI identifies the last record's time separately. No assertion of
continued block progression is made.

The configured origin is contacted only with GET, using a fixed `/chain-status`
URL, a five-second timeout, a 64 KiB response limit, and a dedicated secret.
Caller headers, cookies, bodies, paths, and queries are not forwarded.
Redirects are not followed. The Worker rejects self-referential DarCloud
wildcard origins to prevent routing recursion.

## Exact deployment target and affected routing

`wrangler.jsonc` names Worker `quranchain1`, entry point `src/index.ts`, and
D1 binding `DB` / database `openapi-template-db`. The existing route patterns
are `darcloud.host/*`, `*.darcloud.host/*`, `darcloud.net/*`, and
`*.darcloud.net/*`. This patch does not change routes, DNS, TLS, D1 schema,
or Worker names. The Cloudflare account must be confirmed through the
authenticated provider before deployment; the configuration alone does not
establish which account is currently active.

Directly changed production surfaces include blockchain and revenue hostnames
under both domains; administrative, contract and revenue APIs; the billing
portal authorization check; checkout creation, signup's initial plan and checkout
result pages; health responses on both apex domains and the main OpenAPI
description; and related revenue claims
in the `www` and `pay` landing pages. Authoritative auth/admin/revenue/contracts/
checkout/stripe API paths now reach Hono on all configured subdomains instead
of landing-page catch-all handlers. The separate checkout landing module now
redirects to the canonical authenticated flow.

The GitHub deployment workflow runs on pushes to `main` or manual dispatch.
A review branch does not trigger this workflow. Merging into `main` does.
The existing workflow also applies remote D1 migrations before deployment;
inspect any pending migrations and retain backups before using that workflow.
The new `Verify pull request` workflow runs type checking and the same build/test
command on Node 22 with read-only repository permissions. It has no deployment,
remote database migration, or provider secret access.

## Required connections and configuration

1. An authenticated Cloudflare account with permission to deploy the existing
   Worker. Local `wrangler whoami` reported unauthenticated during preparation.
   Use the connection preflight below to check GitHub's existing credential
   configuration; secret names in a workflow are not proof of valid access.
   On 2026-09-21 the browser dashboard remained on its security verification
   screen after one reload; no account authentication was completed.
2. Authorized access to the existing bot host to install this patch and restart
   the bot. The working host and its current database have not been connected
   or inspected in this task.
   The repository's PM2 configuration names `quranchain-bot` and a
   `/workspaces/quranchain1/quranchain-bot` working directory, but gives no
   reachable host address. Its existing tunnel configuration points to port
   8787, not the ledger IPC listener on 9002, and is not a usable status origin.
3. A verified HTTPS origin that exposes only GET `/chain-status` to the Worker,
   preserving the IPC listener's loopback binding. It must not resolve back to
   this Worker's wildcard route. Do not expose the entire IPC server or revenue
   application. No tunnel or origin has been created by this patch.
4. `CHAIN_STATUS_URL` in the Worker and a securely configured matching
   `CHAIN_STATUS_TOKEN` in the Worker and bot host. Store the token through the
   provider's secret mechanism; do not commit it or paste it into chat.
5. `ADMIN_USER_IDS` containing the intended operator's existing database user
   IDs, verified from authenticated account records. An absent allowlist
   intentionally denies administrative and aggregate financial access. Do not
   assume an account ID or infer privilege from an email address.
6. For checkout, the existing `STRIPE_SECRET_KEY` must have the necessary
   Customer read/create and Checkout Session permissions in the intended
   Stripe account. This patch retains the repository's existing Price IDs;
   their availability and account ownership have not been verified live.
   No live customer, Checkout Session, subscription, or charge was created.

Until these are configured, unavailable public ledger data and denied admin
access are expected. Do not describe this state as a live chain deployment.

## Validation and release procedure

Use `npm ci`, `npx tsc --noEmit`, and `npm test` in the review checkout.
`npm test` bundles the real Worker without deploying, runs the Workers
integration suite, then runs the SQLite/IPC and UI expiry Node tests. Node 22
or newer is required for the tests' built-in SQLite fixtures; production
continues to use the bot's existing better-sqlite3 dependency.

The tests use isolated D1 data, real in-memory SQLite and local HTTP IPC, and
controlled upstream/Stripe responses. They establish code behavior, not the
availability of an external node, money collected, or a production deployment.

Observed local validation on 2026-09-21 (Node v24.19.0):

| Command/check | Result |
| --- | --- |
| Baseline `npm test` before edits | Build passed; 46 Workers tests passed |
| Updated `npm test`, including checkout follow-up | Build passed; 154 Workers tests and 10 Node tests passed |
| `npx tsc --noEmit` | Passed, exit 0 |
| `git diff --check` | Passed |
| `wrangler whoami` | Unauthenticated; no provider deployment performed |

Regression tests were first observed failing for fabricated/absent public
status behavior, unverified fleet health, financial access, and browser expiry,
then passed after implementation. The full updated test command exited 0.
Checkout ownership and alias regressions were also observed failing before
their fixes. These tests cover signed identity, customer mapping conflicts,
missing configuration, upstream errors, unchanged paid entitlements, honest
checkout result pages, and authenticated routing on both checkout aliases.

After review and configuration, first verify the authenticated origin's exact
projection on the bot host. Then deploy the same tested Worker revision through
the existing provider workflow. Record the provider-returned deployment ID.
Read back the affected HTTPS routes: compare public counts/timestamps against
the authenticated origin, verify unavailable/stale behavior, and confirm
anonymous/member denial plus authorized administrator access. Do not exercise
payment mutations for verification. No deployment ID or successful public
release can be reported until these checks actually run.

## Connection check without the browser

`Cloudflare connection preflight` in
`.github/workflows/cloudflare-preflight.yml` uses the existing GitHub secret
names `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. It runs when this
workflow file changes on `fix/verified-public-status`; its job also checks the
exact repository and branch. It does not check out repository code or install
dependencies and has no GitHub token permissions.

The preflight first reports only whether those two values are configured.
If present, it makes one fixed-origin HTTPS GET for the existing `quranchain1`
Worker's deployment history. Redirects are rejected, reads are bounded, and
only validated deployment/version identifiers, percentages and timestamps can
be printed. It never publishes a Worker, runs a migration, changes DNS, or
prints secret values or raw provider responses.

Missing configuration or rejected credentials are blockers, not deployment
success. Configure the required values through the repository's Actions secret
settings or an approved secure connection; never put them in source or chat.
A successful preflight proves read access to existing deployment metadata. It
does not prove write permission or satisfy the bot-host, origin, administrator,
or payment-fulfillment prerequisites above.

## Compatibility and limitations

- Contract API field names that previously called seeded fees revenue now
  identify contractual amounts. Consumers of those old fields must be updated.
- Contract/client payment labels remain stored records and are explicitly
  unverified. Revenue/treasury reports identify their D1 source and are not
  reconciled processor collections or bank balances.
- Unconfigured administrator IDs intentionally close previously overbroad
  access. Configure the correct existing operator account before rollout.
- Checkout now creates a Stripe customer for the authenticated D1 user with
  server-controlled application/user metadata, a stable idempotency key, and
  a conditional write to `users.darpay_customer_id`. Existing mappings are
  reused only after processor metadata confirms ownership; unknown legacy
  mappings fail closed and need authoritative reconciliation. Submitted email,
  Discord ID, user ID, and customer ID cannot establish checkout ownership.
  The portal still requires the authenticated user's stored mapping. Controlled
  test responses do not establish production customer mapping readiness.
- Signup always starts with the `starter` plan. Checkout creation does not
  activate a paid plan, and a browser success redirect is labeled unverified.
  The existing webhook's entitlement fulfillment still relies on legacy
  Discord metadata; it has not been migrated to the new server-owned user
  reference. Verified paid-plan fulfillment remains a separate release blocker
  before offering this flow as an operational paid subscription product.
- Generic system health is degraded when the fleet is unmeasured; monitoring
  must not interpret it as a verified fleet outage or healthy fleet.
- Other mesh/network marketing and service-status implementations were not
  repaired or certified by this focused ledger/financial patch.

For rollback, retain the previous Worker deployment ID before release and
restore it through the provider if necessary. The patch adds no migrations.
Restoring the previous code would also restore the removed misleading outputs
and weaker access checks, so prefer correcting configuration or a forward fix.
The bot endpoint can be disabled by removing its dedicated token; unrelated
loopback IPC remains in place.
