export enum QuotaType {
  NONE,
  FIFO,
}

/**
 *  Represents bucket settings
 */
export class BucketSettings {
  /**
   * Maximal block size in a block
   */
  readonly maxBlockSize?: bigint;

  /**
   * Maximum number of records in a block
   */
  readonly maxBlockRecords?: bigint;

  /**
   * Quota type. The storage supports two types:
   *   NONE: A bucket will consume the whole free disk space.
   *   FIFO: A bucket removes the oldest block of some entry, when it reaches the quota limit.
   */
  readonly quotaType?: QuotaType;

  /**
   * Quota size in bytes
   */
  readonly quotaSize?: bigint;

  static parse(data: Original): BucketSettings {
    const { max_block_size, max_block_records, quota_type, quota_size } = data;
    return {
      maxBlockSize: max_block_size,
      maxBlockRecords: max_block_records,
      // @ts-ignore
      quotaType: quota_type !== undefined ? QuotaType[quota_type] : undefined,
      quotaSize: quota_size,
    };
  }

  static serialize(settings: BucketSettings): Original {
    const { maxBlockSize, maxBlockRecords, quotaType, quotaSize } = settings;
    return {
      max_block_size: maxBlockSize,
      max_block_records: maxBlockRecords,
      quota_type: quotaType !== undefined ? QuotaType[quotaType] : undefined,
      quota_size: quotaSize,
    };
  }
}

type Original = {
  quota_size?: bigint;
  max_block_size?: bigint;
  quota_type?: string;
  max_block_records?: bigint;
};
