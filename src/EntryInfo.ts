/**
 * Information about entry
 */
export class EntryInfo {
    /**
     * Name of the entry
     */
    readonly name: string = "";

    /**
     * Number of blocks
     */
    readonly blockCount: bigint = 0n;

    /**
     * Number of records
     */
    readonly recordCount: bigint = 0n;

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

    static parse(bucket: Original): EntryInfo {
        return {
            name: bucket.name,
            blockCount: BigInt(bucket.block_count),
            recordCount: BigInt(bucket.record_count),
            size: BigInt(bucket.size),
            oldestRecord: BigInt(bucket.oldest_record),
            latestRecord: BigInt(bucket.latest_record),
        };
    }
}

type Original = {
    name: string; block_count: string; record_count: string; size: string; oldest_record: string; latest_record: string;
};
