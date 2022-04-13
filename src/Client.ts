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
        return this.httpClient.get("/info").then((resp: AxiosResponse) => {
            const {data} = resp;
            return Promise.resolve(ServerInfo.parse(data));
        });
    }

    /**
     * Get list of buckets
     * @async
     * @return {BucketInfo[]}
     * @see BucketInfo
     */
    async getBucketList(): Promise<BucketInfo[]> {
        return this.httpClient.get("/list").then((resp: AxiosResponse) => {
            return resp.data.buckets.map((bucket: any) => BucketInfo.parse(bucket));
        });
    }

    /**
     * Create a new bucket
     * @param name Name of the bucket
     * @param settings Optional settings
     * @return Promise<Bucket>
     */
    async createBucket(name: string, settings?: BucketSettings): Promise<Bucket> {
        return this.httpClient.post(`/b/${name}`, settings ? BucketSettings.serialize(settings) : undefined)
            .then(() => Promise.resolve(new Bucket(name, this.httpClient)));
    }

    /**
     * Get a bucket by name
     * @param name Name of the bucket
     * @return Promise<Bucket>
     */
    async getBucket(name: string): Promise<Bucket> {
        return this.httpClient.get(`/b/${name}`)
            .then(() => Promise.resolve(new Bucket(name, this.httpClient)));
    }
}
