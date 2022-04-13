/**
 * Represents HTTP Client for Reduct Storage API
 * @class
 */
import {ServerInfo} from "./ServerInfo";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import axios, {AxiosInstance, AxiosResponse, AxiosError} from "axios";
import {APIError} from "./APIError";
import {BucketInfo} from "./BucketInfo";
import {BucketSettings} from "./BucketSettings";
import {Bucket} from "./Bucket";

export class Client {
    private httpClient: AxiosInstance;

    /**
     * HTTP Client for Reduct Storage
     * @param url URL to the storage
     */
    constructor(url: string) {
        this.httpClient = axios.create({
            baseURL: url,
            timeout: 1000
        });

        this.httpClient.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error: AxiosError) => Promise.reject(APIError.from(error))
        );
    }

    /**
     * Get server information
     * @see ServerInfo
     * @async
     * @return {Promise<ServerInfo>} The data about the server
     */
    async getInfo(): Promise<ServerInfo> {
        const {data} = await this.httpClient.get("/info");
        return ServerInfo.parse(data);
    }

    /**
     * Get list of buckets
     * @async
     * @return {BucketInfo[]}
     * @see BucketInfo
     */
    async getBucketList(): Promise<BucketInfo[]> {
        const {data} = await this.httpClient.get("/list");
        return data.buckets.map((bucket: any) => BucketInfo.parse(bucket));
    }

    /**
     * Create a new bucket
     * @param name Name of the bucket
     * @param settings Optional settings
     * @return Promise<Bucket>
     */
    async createBucket(name: string, settings?: BucketSettings): Promise<Bucket> {
        await this.httpClient.post(`/b/${name}`, settings ? BucketSettings.serialize(settings) : undefined);
        return new Bucket(name, this.httpClient);
    }

    /**
     * Get a bucket by name
     * @param name Name of the bucket
     * @return Promise<Bucket>
     */
    async getBucket(name: string): Promise<Bucket> {
        await this.httpClient.get(`/b/${name}`);
        return new Bucket(name, this.httpClient);
    }
}
