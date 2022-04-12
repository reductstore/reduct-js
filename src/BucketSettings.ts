export enum QuotaType {
    NONE,
    FIFO
}

/**
 *  Represents bucket settings
 */
export class BucketSettings {
    readonly maxBlockSize?: BigInt;
    readonly quotaType?: QuotaType;
    readonly quotaSize?: BigInt;

    static parse(data: any): BucketSettings {
        return {
            maxBlockSize: BigInt(data.max_block_size),
            // @ts-ignore
            quotaType: QuotaType[data.quota_type],
            quotaSize: BigInt(data.quota_size)
        };
    }


}
