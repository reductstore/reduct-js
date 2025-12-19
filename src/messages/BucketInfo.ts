import { Status } from "./Status";

function parseStatus(status?: string): Status {
  if (status === "DELETING") {
    return Status.DELETING;
  }
  return Status.READY;
}

/**
 * Represents information about a bucket
 */
export class BucketInfo {
  /**
   * Name of the bucket
   */
  readonly name: string = "";

  /**
   * Number of entries in the bucket
   */
  readonly entryCount: bigint = 0n;

  /**
   * Size of stored data in the bucket in bytes
   */
  readonly size: bigint = 0n;

  /**
   * Unix timestamp of the oldest record in microseconds
   */
  readonly oldestRecord: bigint = 0n;

  /**
   * Unix timestamp of the latest record in microseconds
   */
  readonly latestRecord: bigint = 0n;

  /**
   * Is the bucket provisioned, and you can't remove it or change its settings
   */
  readonly isProvisioned?: boolean = false;

  /**
   * Current status of the bucket (READY or DELETING)
   */
  readonly status: Status = Status.READY;

  static parse(bucket: OriginalBucketInfo): BucketInfo {
    return {
      name: bucket.name,
      entryCount: BigInt(bucket.entry_count),
      size: BigInt(bucket.size),
      oldestRecord: BigInt(bucket.oldest_record),
      latestRecord: BigInt(bucket.latest_record),
      isProvisioned: bucket.is_provisioned ?? false,
      status: parseStatus(bucket.status),
    };
  }
}

export type OriginalBucketInfo = {
  name: string;
  entry_count: string;
  size: string;
  oldest_record: string;
  latest_record: string;
  is_provisioned?: boolean;
  status?: string;
};
