export enum QueryType {
  QUERY,
  REMOVE,
}

export interface QueryEntry {
  query_type: string;

  /** List of entries to query */
  entries?: string[];

  /** Start query from (Unix timestamp in microseconds) */
  start?: bigint;
  /** Stop query at (Unix timestamp in microseconds) */
  stop?: bigint;

  /** TTL of query in seconds */
  ttl?: number;
  /** Retrieve only metadata */
  only_metadata?: boolean;
  /** Continuous query, it doesn't stop until the TTL is reached */
  continuous?: boolean;

  /** Conditional query */
  when?: any;
  /** Strict conditional query
   * If true, the query returns an error if any condition cannot be evaluated
   */
  strict?: boolean;

  /** Additional parameters for extensions */
  ext?: Record<string, any>;
}

/**
 * Options for querying records
 */
export class QueryOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Return only one record per S second
   * @deprecated: use $each_t operator in when instead. Will be remove in v1.18.0
   * */
  eachS?: number;
  /** Return only one record per N records
   *  @deprecated: use $each_n operator in when instead. Will be remove in v1.18.0
   * */
  eachN?: number;
  /** Limit number of records
   *  @deprecated: use $limit operator in when instead. Will be remove in v1.18.0
   * */
  limit?: number;

  /** Don't stop query until TTL is reached */
  continuous?: boolean;
  /** Poll interval for new records only for continue=true */
  pollInterval?: number;
  /** Return only metadata */
  head?: boolean;
  /** Conditional query */
  when?: Record<string, any>;
  /**  strict conditional query */
  strict?: boolean;
  /** Additional parameters for extensions */
  ext?: Record<string, any>;

  static serialize(
    queryType: QueryType,
    data: QueryOptions,
    start?: bigint,
    stop?: bigint,
    entries?: string[],
  ): QueryEntry {
    return {
      start: start,
      stop: stop,
      query_type: QueryType[queryType],
      entries,
      ttl: data.ttl,
      continuous: data.continuous,
      when: data.when,
      strict: data.strict,
      only_metadata: data.head,
      ext: data.ext,
    };
  }
}
