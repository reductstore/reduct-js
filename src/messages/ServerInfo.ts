import { BucketSettings } from "./BucketSettings";

export class ServerDefaults {
  readonly bucket: BucketSettings = {};
}

export class LicenseInfo {
  /// Licensee name
  readonly licensee: string = "UNKNOWN";
  /// Invoice number
  readonly invoice: string = "UNKNOWN";
  /// Expiry date as unix timestamp in milliseconds
  readonly expiryDate: number = 0;
  /// Plan name
  readonly plan: string = "UNKNOWN";
  /// Number of devices
  readonly deviceNumber: number = 0;
  /// Disk quota
  readonly diskQuota: number = 0;
  /// Fingerprint
  readonly fingerprint: string = "UNKNOWN";

  static parse(data: OriginalLicenseInfo): LicenseInfo {
    return {
      licensee: data.licensee,
      invoice: data.invoice,
      expiryDate: Date.parse(data.expiry_date),
      plan: data.plan,
      deviceNumber: Number(data.device_number),
      diskQuota: Number(data.disk_quota),
      fingerprint: data.fingerprint,
    };
  }
}

/**
 * Represents information about storage
 */
export class ServerInfo {
  /**
   * Version storage server
   */
  readonly version: string = "";

  /**
   * Number of buckets
   */
  readonly bucketCount: bigint = 0n;

  /**
   * Stored data in bytes
   */
  readonly usage: bigint = 0n;

  /**
   * Server uptime in seconds
   */
  readonly uptime: bigint = 0n;

  /**
   * Unix timestamp of the oldest record in microseconds
   */
  readonly oldestRecord: bigint = 0n;

  /**
   * Unix timestamp of the latest record in microseconds
   */
  readonly latestRecord: bigint = 0n;

  /**
   * License information
   */
  readonly license?: LicenseInfo;

  /**
   * Default settings
   */
  readonly defaults: ServerDefaults = { bucket: {} };

  static parse(data: OriginalServerInfo): ServerInfo {
    return {
      version: data.version,
      bucketCount: BigInt(data.bucket_count),
      uptime: BigInt(data.uptime),
      usage: BigInt(data.usage),
      oldestRecord: BigInt(data.oldest_record),
      latestRecord: BigInt(data.latest_record),
      license: data.license ? LicenseInfo.parse(data.license) : undefined,
      defaults: {
        bucket: BucketSettings.parse(data.defaults.bucket),
      },
    };
  }
}

type OriginalLicenseInfo = {
  licensee: string;
  invoice: string;
  expiry_date: string;
  plan: string;
  device_number: number;
  disk_quota: number;
  fingerprint: string;
};

export type OriginalServerInfo = {
  version: string;
  bucket_count: string;
  uptime: string;
  usage: string;
  oldest_record: string;
  latest_record: string;

  license?: OriginalLicenseInfo;
  defaults: {
    bucket: {
      quota_size: bigint;
      max_block_size: bigint;
      quota_type: string;
      max_block_records: bigint;
    };
  };
};
