// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

import type { Context } from "hono";

export type AppContext = Context<{ 
	Bindings: Env;
	Variables: {
		requestId: string;
	};
}>;
export type HandleArgs = [AppContext];
