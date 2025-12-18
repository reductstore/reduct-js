export type ReplicationMode = "enabled" | "paused" | "disabled";

export const DEFAULT_REPLICATION_MODE: ReplicationMode = "enabled";

export const parseReplicationMode = (mode?: string): ReplicationMode => {
  if (mode === "paused" || mode === "disabled" || mode === "enabled") {
    return mode;
  }

  return DEFAULT_REPLICATION_MODE;
};
