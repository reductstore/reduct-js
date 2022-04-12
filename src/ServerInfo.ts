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
    readonly bucketCount: BigInt = 0n;

    /**
     * Stored data in bytes
     */
    readonly usage: BigInt = 0n;

    /**
     * Server uptime in seconds
     */
    readonly uptime: BigInt = 0n;

    /**
     * Unix timestamp of the oldest record in microseconds
     */
    readonly oldestRecord: BigInt = 0n;

    /**
     * Unix timestamp of the latest record in microseconds
     */
    readonly latestRecord: BigInt = 0n;

    static parse(data: any): ServerInfo {
        return {
            version: data.version,
            bucketCount: BigInt(data.bucket_count),
            uptime: BigInt(data.uptime),
            usage: BigInt(data.usage),
            oldestRecord: BigInt(data.oldest_record),
            latestRecord: BigInt(data.latest_record),
        };
    }
}
