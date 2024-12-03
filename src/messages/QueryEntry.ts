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
}

/**
 * Options for querying records
 */
export class QueryOptions {
  ttl?: number; // Time to live in seconds
  include?: LabelMap; //  include only record which have all these labels with the same value
  exclude?: LabelMap; //  exclude record which have all these labels with the same value
  eachS?: number; //  return only one record per S second
  eachN?: number; //  return each N-th record
  limit?: number; //  limit number of records
  continuous?: boolean; //  await for new records
  pollInterval?: number; //  interval for polling new records (only for continue=true)
  head?: boolean; //  return only head of the record
  when?: Record<string, any>; //  conditional query
  strict?: boolean; //  strict conditional query

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
    };
  }
}
