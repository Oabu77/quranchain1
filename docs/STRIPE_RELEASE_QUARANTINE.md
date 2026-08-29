# Stripe release quarantine

Status: release blocker  
Inventory snapshot: 2026-08-29 UTC  
Account scope: DarCloud only; Total Leads Today LLC is out of scope.

This runbook prevents unsupported products from remaining purchasable while
preserving any verified DarCloud Junk Removal service. It is intentionally
reversible and does not authorize financial, crypto, telecom, government,
health, insurance, investment, or religious-payment offerings.

## Read-only findings

- At least 27,500 active products were enumerated; Stripe still reported more.
- Exactly 1,152 active Payment Links were enumerated in the snapshot.
- A strict product search found no active product named or described as a
  junk-removal, hauling, cleanout, debris, dumpster, furniture-removal,
  appliance-removal, yard-waste, or trash-removal service.
- A line-item sample of the first 1,000 active Payment Links found zero
  junk-removal links.
- No active or historical subscriptions were returned by the connected account.
- No open Checkout Sessions were returned.
- Six webhook endpoints exist; five were enabled in the read-only snapshot.

These counts are minimums, not totals. Product and Payment Link generation must
be stopped before cleanup, or newly generated objects can immediately recreate
the exposure.

## Required order of operations

1. Identify and disable every job, Worker, bot, workflow, or script that creates
   Stripe products, prices, or Payment Links.
2. Export the complete product, price, Payment Link, webhook, Checkout Session,
   PaymentIntent, charge, refund, dispute, and customer inventory from Stripe.
   Preserve the export and record the UTC cutoff time.
3. Tag only a verified DarCloud Junk Removal offering as `release_preserve`.
   A preserved item must have a truthful service description, service area,
   fulfillment process, refund/cancellation terms, customer-support route, and
   statement descriptor. Do not infer preservation from a generic DarCloud name.
4. Deactivate unsupported Payment Links first. This stops new purchases while
   retaining the objects and their audit history.
5. Archive/deactivate the corresponding unsupported products and prices. Do not
   delete customer, payment, refund, dispute, invoice, or accounting records.
6. Disable obsolete webhook endpoints, rotate the secrets of endpoints that
   remain, and verify signatures before processing events. The current hardened
   application intentionally returns `410 Gone` for its retired Stripe webhook.
7. Re-run the inventory. The acceptable pre-release state is:
   - zero active unsupported Payment Links;
   - zero active unsupported products or prices;
   - zero open unsupported Checkout Sessions;
   - zero unverified webhook consumers;
   - only verified junk-removal checkout paths, if any.
8. Test the retained junk-removal checkout in Stripe test mode, including a
   successful payment, cancellation, refund, webhook-signature rejection, and
   customer-support handoff. Live mode is not a substitute for test mode.

## Approval and rollback

Bulk deactivation is a live, customer-facing change and requires an exact target
list plus action-time approval. The safe default is to quarantine unsupported
Payment Links before products. If a verified junk-removal item is mistakenly
deactivated, reactivate only that exact item after its description and
fulfillment controls are reviewed. Never reactivate a broad category or an
automatically generated catalog.

## Evidence to retain

- Full exported inventories and UTC timestamps
- IDs of the exact objects changed, stored outside the public repository
- The approving operator and the approved target count
- Before/after counts by object type
- Test-mode payment and refund evidence
- Webhook signature-verification test evidence
- Stripe Dashboard screenshots showing the final active catalog

Do not place API keys, webhook secrets, customer data, payment identifiers, or
private export files in this repository.
