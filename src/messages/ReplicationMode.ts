/**
 * ReplicationMode string literal type for TypeScript type checking
 */
export type ReplicationMode = "enabled" | "paused" | "disabled";

/**
 * ReplicationMode namespace providing constant values for runtime usage
 * This allows both TypeScript type usage and JavaScript runtime value access
 * @example
 * // TypeScript type usage:
 * const mode: ReplicationMode = "enabled";
 * 
 * // JavaScript runtime constant usage:
 * import { ReplicationMode } from 'reduct-js';
 * const mode = ReplicationMode.ENABLED; // "enabled"
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReplicationMode {
  export const ENABLED = "enabled";
  export const PAUSED = "paused";
  export const DISABLED = "disabled";
}

export const DEFAULT_REPLICATION_MODE: ReplicationMode = "enabled";

export const parseReplicationMode = (mode?: string): ReplicationMode => {
  if (mode === "paused" || mode === "disabled" || mode === "enabled") {
    return mode;
  }

  return DEFAULT_REPLICATION_MODE;
};
