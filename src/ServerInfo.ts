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
    bucketCount: BigInt

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
    oldestRecord: BigInt

    /**
     * Unix timestamp of the latest record in microseconds
     */
    latestRecord: BigInt
}
