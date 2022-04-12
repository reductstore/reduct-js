export enum QuotaType {
    NONE,
    FIFO
}

export interface BucketSettings {
    maxBlockSize?: BigInt
    quotaType?: QuotaType
    quotaSize: BigInt
}
