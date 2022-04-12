/**
 * Represents information about storage
 */
export interface ServerInfo {
    /**
     * Version storage server
     */
    version: string

    /**
     * Number of buckets
     */
    bucket_count: BigInt

    /**
     * Stored data in bytes
     */
    usage: BigInt

    /**
     * Server uptime in seconds
     */
    uptime: BigInt

    /**
     * Unix timestamp of the oldest record in microseconds
     */
    oldest_record: BigInt

    /**
     * Unix timestamp of the latest record in microseconds
     */
    latest_record: BigInt
}
