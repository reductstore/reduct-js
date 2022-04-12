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
    readonly entryCount: BigInt = 0n;

    /**
     * Size of stored data in the bucket in bytes
     */
    readonly size: BigInt = 0n;

    /**
     * Unix timestamp of the oldest record in microseconds
     */
    readonly oldestRecord: BigInt = 0n;

    /**
     * Unix timestamp of the latest record in microseconds
     */
    readonly latestRecord: BigInt = 0n;


    static parse(bucket: any): BucketInfo {
        return {
            name: bucket.name,
            entryCount: BigInt(bucket.entry_count),
            size: BigInt(bucket.size),
            oldestRecord: BigInt(bucket.oldest_record),
            latestRecord: BigInt(bucket.latest_record),
        };
    }
}

