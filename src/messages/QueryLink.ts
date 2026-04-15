import { QueryOptions, QueryType } from "./QueryEntry";

/**
 * Represents information about a bucket
 */
export class QueryLinkOptions {
  /** bucket name */
  bucket = "";
  /** entry name (or bucket name for multi-entry queries) */
  entry = "";
  /** selected record entry name */
  recordEntry = "";
  /** selected record timestamp */
  recordTimestamp = 0n;
  /** record index */
  index = 0;
  /** query */
  query: QueryOptions = {};
  /** expiration time as UNIX timestamp in seconds */
  expireAt: Date = new Date(0);
  /** base url for link generation */
  baseUrl?: string;

  static serialize(
    options: QueryLinkOptions,
    start?: bigint,
    stop?: bigint,
    entries?: string[],
  ): OriginalCreateQueryLink {
    return {
      bucket: options.bucket,
      entry: options.entry,
      record_entry: options.recordEntry,
      record_timestamp: options.recordTimestamp,
      index: options.index,
      query: QueryOptions.serialize(
        QueryType.QUERY,
        options.query,
        start,
        stop,
        entries,
      ),
      expire_at: Math.floor(options.expireAt.getTime() / 1000),
      base_url: options.baseUrl,
    };
  }
}

export type OriginalCreateQueryLink = {
  bucket: string;
  entry: string;
  record_entry?: string;
  record_timestamp?: bigint | number;
  index?: number;
  query: any;
  expire_at: number;
  base_url?: string;
};
