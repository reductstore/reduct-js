/**
 * Replication settings
 */

import {
  DEFAULT_REPLICATION_MODE,
  parseReplicationMode,
  ReplicationMode,
} from "./ReplicationMode";

export class OriginalReplicationSettings {
  src_bucket = "";
  dst_bucket = "";
  dst_host = "";
  dst_token?: string;
  entries: string[] = [];
  when?: any;
  mode?: ReplicationMode;
}

/**
 * Replication settings
 */
export class ReplicationSettings {
  /**
   * Source bucket. Must exist.
   */
  readonly srcBucket: string = "";

  /**
   * Destination bucket. Must exist.
   */
  readonly dstBucket: string = "";

  /**
   * Destination host. Must exist.
   */
  readonly dstHost: string = "";

  /**
   * Destination token. Must have write access to the destination bucket.
   */
  readonly dstToken?: string;

  /**
   * List of entries to replicate. If empty, all entries are replicated. Wildcards are supported.
   */
  readonly entries: string[] = [];

  /**
   * Conditional query
   */
  readonly when?: any;

  /**
   * Replication mode
   */
  readonly mode?: ReplicationMode;

  static parse(data: OriginalReplicationSettings): ReplicationSettings {
    return {
      srcBucket: data.src_bucket,
      dstBucket: data.dst_bucket,
      dstHost: data.dst_host,
      dstToken: data.dst_token,
      entries: data.entries,
      when: data.when,
      mode: parseReplicationMode(data.mode),
    };
  }

  static serialize(data: ReplicationSettings): OriginalReplicationSettings {
    return {
      src_bucket: data.srcBucket,
      dst_bucket: data.dstBucket,
      dst_host: data.dstHost,
      dst_token: data.dstToken,
      entries: data.entries,
      when: data.when,
      mode: data.mode ?? DEFAULT_REPLICATION_MODE,
    };
  }
}
