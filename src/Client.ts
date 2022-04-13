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
import {hash, codec} from "sjcl";

export type ClientOptions = {
    apiToken?: string
}

export class Client {
    private httpClient: AxiosInstance;

    /**
     * HTTP Client for Reduct Storage
     * @param url URL to the storage
     * @param options
     */
    constructor(url: string, options: ClientOptions = {}) {
        this.httpClient = axios.create({
            baseURL: url,
            timeout: 1000,
        });

        this.httpClient.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError) => {
                if (error.config && error.response && error.response.status == 401 && options.apiToken) {
                    const {config} = error;
                    const hashedToken = hash.sha256.hash(options.apiToken);

                    config.headers ||= {};
                    config.headers["Authorization"] = `Bearer ${codec.hex.fromBits(hashedToken)}`;
                    try {
                        // Use axios instead the instance not to cycle with 401 error
                        const resp: AxiosResponse = await axios.post("/auth/refresh", null, config);
                        const {access_token} = resp.data;

                        config.headers["Authorization"] = `Bearer ${access_token}`;
                        this.httpClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
                        // Repiet request after token updated
                        return this.httpClient.request(error.config);
                    } catch (error) {
                        //@ts-ignore
                        throw APIError.from(error);
                    }
                }

                throw APIError.from(error);
            }
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
