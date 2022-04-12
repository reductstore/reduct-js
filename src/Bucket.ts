// @ts-ignore
import {AxiosInstance, AxiosResponse} from "axios";
import {BucketSettings, QuotaType} from "./BucketSettings";

/**
 * Represents a bucket in Reduct Storage
 */
export class Bucket {
    readonly name: string;
    private httpClient: AxiosInstance;

    /**
     * Create a bucket. Use Client.creatBucket or Client.getBucket instead it
     * @constructor
     * @param name
     * @param httpClient
     * @see {Client}
     */
    constructor(name: string, httpClient: AxiosInstance) {
        this.name = name;
        this.httpClient = httpClient;
    }

    /**
     * Get bucket settings
     * @async
     * @return {Promise<BucketSettings>}
     */
    async getSettings(): Promise<BucketSettings> {
        return this.httpClient.get(`/b/${this.name}`).then((response: AxiosResponse) => {
            const {settings} = response.data;
            return Promise.resolve({
                maxBlockSize: BigInt(settings.max_block_size),
                quotaType: QuotaType[settings.quota_type],
                quotaSize: BigInt(settings.quota_size)
            });
        });
    }

    /**
     * Remove bucket
     * @async
     * @return {Promise<void>}
     */
    async remove(): Promise<void> {
        return this.httpClient.delete(`/b/${this.name}`).then(() => Promise.resolve());
    }


}
