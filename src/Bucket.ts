// @ts-ignore
import {AxiosInstance, AxiosResponse} from "axios";
import {BucketSettings} from "./BucketSettings";
import {BucketInfo} from "./BucketInfo";

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
            return Promise.resolve(BucketSettings.parse(settings));
        });
    }

    /**
     * Set bucket settings
     * @async
     * @param settings {BucketSettings} new settings (you can set a part of settings)
     */
    async setSettings(settings: BucketSettings): Promise<void> {
        return this.httpClient.put(`/b/${this.name}`, BucketSettings.serialize(settings))
            .then(() => Promise.resolve());
    }

    /**
     * Get information about a bucket
     * @async
     * @return {Promise<BucketInfo>}
     */
    async getInfo(): Promise<BucketInfo> {
        return this.httpClient.get(`/b/${this.name}`).then((response: AxiosResponse) => {
            const {info} = response.data;
            return Promise.resolve(BucketInfo.parse(info));
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
