import type { Config } from "../config";
import type { RequestRepository } from "../db/request-repository";
import type { SessionStore } from "./sessions";

/** Everything a handler may depend on, injected once in index.ts. */
export interface AppDeps {
  config: Config;
  requests: RequestRepository;
  sessions: SessionStore;
}
