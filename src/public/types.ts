export type PublicBindings = Env & {
  DARCLOUD_ADMIN_EMAILS?: string;
};

export type PublicVariables = {
  user: Record<string, unknown>;
};

export type PublicAppEnv = {
  Bindings: PublicBindings;
  Variables: PublicVariables;
};
