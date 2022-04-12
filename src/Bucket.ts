// @ts-ignore
import {AxiosInstance} from "axios";

/**
 * Represents a bucket in Reduct Storage
 */
export class Bucket {
    private name: string;
    private httpClient: AxiosInstance;

    /**
     * Creats a bucket. Use Client.creatBucket or Client.getBucket instead it
     * @param name
     * @param httpClient
     * @see {Client}
     */
    constructor(name: string, httpClient: AxiosInstance) {
        this.name = name;
        this.httpClient = httpClient;
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
