/** Runtime bindings required by this validation-only Worker. */
export interface Env {
	DB: D1Database;
}

declare global {
	interface Env {
		DB: D1Database;
	}
}
