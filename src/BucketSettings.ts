type Original = { quota_size?: string; max_block_size?: string; quota_type?: string };

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

    static parse(data: Original): BucketSettings {
        const {max_block_size, quota_type, quota_size} = data;
        return {
            maxBlockSize: max_block_size !== undefined ? BigInt(max_block_size) : undefined,
            // @ts-ignore
            quotaType: quota_type !== undefined ? QuotaType[quota_type] : undefined,
            quotaSize: quota_size !== undefined ? BigInt(quota_size) : undefined
        };
    }

    static serialize(settings: BucketSettings): Original {
        const {maxBlockSize, quotaType, quotaSize} = settings;
        return {
            max_block_size: maxBlockSize !== undefined ? maxBlockSize.toString() : undefined,
            quota_type: quotaType !== undefined ? quotaType.toString() : undefined,
            quota_size: quotaSize !== undefined ? quotaSize.toString() : undefined,
        };
    }


}
