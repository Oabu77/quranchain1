"use strict";

// Legacy bot checkout and revenue automation are quarantined. The Worker also
// disables checkout and only acknowledges correctly signed Stripe webhooks
// without granting entitlements or mutating financial state.
const REVENUE_SPLIT = Object.freeze({});
const STRIPE_PRODUCTS = Object.freeze({});
const GAS_TOLL_CHAINS = Object.freeze([]);

function disabledError() {
  const error = new Error(
    "DarCloud bot payments, subscriptions, gas tolls, and revenue distribution are disabled."
  );
  error.code = "DARCLOUD_PAYMENTS_DISABLED";
  return error;
}

function createStripeClient() {
  return null;
}

async function createCheckoutSession() {
  throw disabledError();
}

async function handleStripeWebhook() {
  throw disabledError();
}

function getRevenueReport() {
  return {
    mode: "disabled",
    verified_revenue_cents: 0,
    payments_enabled: false,
    subscriptions_enabled: false,
    token_fees_enabled: false,
  };
}

module.exports = {
  REVENUE_SPLIT,
  STRIPE_PRODUCTS,
  GAS_TOLL_CHAINS,
  createCheckoutSession,
  handleStripeWebhook,
  getRevenueReport,
  createStripeClient,
};
