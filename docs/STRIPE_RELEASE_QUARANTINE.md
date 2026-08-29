# Stripe release quarantine

Status: release blocker  
Inventory snapshot: 2026-08-29 UTC  
Account scope: DarCloud only; Total Leads Today LLC is out of scope.

This runbook prevents unsupported products from remaining purchasable while
preserving any verified DarCloud Junk Removal service. It is intentionally
reversible and does not authorize financial, crypto, telecom, government,
health, insurance, investment, or religious-payment offerings.

## Read-only findings

- The connected live account contains an abnormally large, automatically
  generated active catalog and many active Payment Links for unsupported
  financial, crypto, telecom, government, health, investment, insurance, and
  other offerings.
- A strict product search found no active item explicitly named or described as
  a junk-removal service. The active Payment Link inventory likewise contained
  no explicit junk-removal label or return URL.
- The live junk-removal site separately advertises a fixed $49 Stripe-hosted
  deposit. No $49 active Payment Link was found in the connected DarCloud
  account, so its exact Stripe account and object must be resolved before bulk
  deactivation. Do not infer that it is safe to remove.
- No subscriptions, open Checkout Sessions, refunds, or disputes were returned.
- Legacy webhook endpoints remain enabled for retired storefronts.
- Unsupported Dar Al Nas funding/settlement PaymentIntents remain confirmable
  with payment methods attached. They must be canceled before release so they
  cannot be charged.

Exact object IDs, counts, amounts, and financial activity are retained outside
this public repository. Product and Payment Link generation must be stopped
before cleanup, or newly generated objects can immediately recreate the
exposure.

## Required order of operations

1. Identify and disable every job, Worker, bot, workflow, or script that creates
   Stripe products, prices, or Payment Links.
2. Export the complete product, price, Payment Link, webhook, Checkout Session,
   PaymentIntent, charge, refund, dispute, and customer inventory from Stripe.
   Preserve the export and record the UTC cutoff time.
3. Resolve the live junk site's fixed $49 deposit to its exact Stripe account,
   Payment Link or Checkout object, product, price, and webhook path. Then tag
   only a verified DarCloud Junk Removal offering as `release_preserve`.
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
