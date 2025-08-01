/**
 * Replication settings
 */

export class OriginalReplicationSettings {
  src_bucket = "";
  dst_bucket = "";
  dst_host = "";
  dst_token = "";
  entries: string[] = [];
  include?: Record<string, string>;
  exclude?: Record<string, string>;
  each_s?: number;
  each_n?: bigint;
  when?: any;
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
  readonly dstToken: string = "";

  /**
   * List of entries to replicate. If empty, all entries are replicated. Wildcards are supported.
   */
  readonly entries: string[] = [];

  /**
   * List of labels a records must include. If empty, all records are replicated.
   * If a few labels are specified, a record must include all of them.
   * @deprecated: use when instead
   */
  readonly include?: Record<string, string>;

  /**
   * List of labels a records must not include. If empty, all records are replicated.
   * If a few labels are specified, a record must not include any of them.
   * @deprecated: use when instead
   */
  readonly exclude?: Record<string, string>;

  /**
   * Replicate a record every S seconds
   * @deprecated: use $each_t instead
   */
  readonly eachS?: number;

  /**
   * Replicate every Nth record
   * @deprecated use $each_n instead
   */
  readonly eachN?: bigint;

  /**
   * Conditional query
   */
  readonly when?: any;

  static parse(data: OriginalReplicationSettings): ReplicationSettings {
    return {
      srcBucket: data.src_bucket,
      dstBucket: data.dst_bucket,
      dstHost: data.dst_host,
      dstToken: data.dst_token,
      include: data.include,
      exclude: data.exclude,
      entries: data.entries,
      eachS: data.each_s,
      eachN: data.each_n ? BigInt(data.each_n) : data.each_n,
      when: data.when,
    };
  }

  static serialize(data: ReplicationSettings): OriginalReplicationSettings {
    return {
      src_bucket: data.srcBucket,
      dst_bucket: data.dstBucket,
      dst_host: data.dstHost,
      dst_token: data.dstToken,
      each_s: data.eachS,
      each_n: data.eachN,
      ...data,
    };
  }
}
