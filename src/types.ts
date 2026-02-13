// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];
