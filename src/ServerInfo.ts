import {BucketSettings} from "./BucketSettings";


export class ServerDefaults {
    readonly bucket: BucketSettings = {};
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
     * Default settings
     */
    readonly defaults: ServerDefaults = {bucket: {}};

    static parse(data: Original): ServerInfo {
        return {
            version: data.version,
            bucketCount: BigInt(data.bucket_count),
            uptime: BigInt(data.uptime),
            usage: BigInt(data.usage),
            oldestRecord: BigInt(data.oldest_record),
            latestRecord: BigInt(data.latest_record),
            defaults: {
                bucket: BucketSettings.parse(data.defaults.bucket)
            }
        };
    }
}

type Original = {
    version: string;
    bucket_count: string;
    uptime: string;
    usage: string;
    oldest_record: string;
    latest_record: string;
    defaults: {
        bucket: { quota_size: bigint; max_block_size: bigint; quota_type: string,  max_block_records: bigint };

    }
}
