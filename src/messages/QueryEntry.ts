import { LabelMap } from "../Record";

export enum QueryType {
  QUERY,
  REMOVE,
}

export interface QueryEntry {
  query_type: string;

  /** Start query from (Unix timestamp in microseconds) */
  start?: number;
  /** Stop query at (Unix timestamp in microseconds) */
  stop?: number;

  /** Include records with label */
  include?: Record<string, string>;
  /** Exclude records with label */
  exclude?: Record<string, string>;
  /** Return a record every S seconds */
  each_s?: number;
  /** Return a record every N records */
  each_n?: number;
  /** Limit the number of records returned */
  limit?: number;

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
  /** Include records with label
   *  @deprecated: use when instead
   * */
  include?: LabelMap;
  /** Exclude records with label
   *  @deprecated: use when instead
   * */
  exclude?: LabelMap;
  /** Return only one record per S second */
  eachS?: number;
  /** Return only one record per N records */
  eachN?: number;
  /** Limit number of records */
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

  static serialize(queryType: QueryType, data: QueryOptions): QueryEntry {
    return {
      query_type: QueryType[queryType],
      ttl: data.ttl,
      include: data.include as Record<string, string>,
      exclude: data.exclude as Record<string, string>,
      each_s: data.eachS,
      each_n: data.eachN,
      limit: data.limit,
      continuous: data.continuous,
      when: data.when,
      strict: data.strict,
      only_metadata: data.head,
      ext: data.ext,
    };
  }
}
