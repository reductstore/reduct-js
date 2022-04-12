// @ts-ignore
import {AxiosInstance} from "axios";
import {BucketSettings} from "./BucketSettings";

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

    // async getSettings(): Promise<BucketSettings> {
    //     return this.httpClient.get(`/b/${this.name}`).then(response => {
    //         response.data.
    //     })
    // }

    /**
     * Remove bucket
     * @async
     * @return {Promise<void>}
     */
    async remove(): Promise<void> {
        return this.httpClient.delete(`/b/${this.name}`).then(() => Promise.resolve());
    }


}