/**
 * ReplicationCompression string literal type for TypeScript type checking.
 */
export type ReplicationCompression = "none" | "zstd" | "gzip";

/**
 * ReplicationCompression namespace providing constant values for runtime usage.
 */
export namespace ReplicationCompression {
  export const NONE: ReplicationCompression = "none";
  export const ZSTD: ReplicationCompression = "zstd";
  export const GZIP: ReplicationCompression = "gzip";
}

export const DEFAULT_REPLICATION_COMPRESSION: ReplicationCompression = "none";

export const parseReplicationCompression = (
  compression?: string,
): ReplicationCompression => {
  if (compression === undefined) {
    return DEFAULT_REPLICATION_COMPRESSION;
  }

  if (
    compression === "none" ||
    compression === "zstd" ||
    compression === "gzip"
  ) {
    return compression;
  }

  throw new Error(`Unknown replication compression: ${compression}`);
};
