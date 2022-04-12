/**
 * Represents information about a bucket
 */
export interface BucketInfo {
    /**
     * Name of the bucket
     */
    name: string

    /**
     * Number of entries in the bucket
     */
    entry_count: BigInt

    /**
     * Size of stored data in the bucket in bytes
     */
    size: BigInt

    /**
     * Unix timestamp of the oldest record in microseconds
     */
    oldest_record: BigInt

    /**
     * Unix timestamp of the latest record in microseconds
     */
    latest_record: BigInt
}
