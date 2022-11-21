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
import {TokenInfo, TokenPermissions} from "./TokenInfo";

/**
 * Options
 */
export type ClientOptions = {
    apiToken?: string;   // API token for authentication
    timeout?: number;    // communication timeout
}

export class Client {
    private readonly httpClient: AxiosInstance;

    /**
     * HTTP Client for Reduct Storage
     * @param url URL to the storage
     * @param options
     */
    constructor(url: string, options: ClientOptions = {}) {
        this.httpClient = axios.create({
            baseURL: `${url}/api/v1`,
            timeout: options.timeout,
            headers: {
                "Authorization": `Bearer ${options.apiToken}`
            }
        });

        this.httpClient.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError) => {
                if (error instanceof AxiosError) {
                    throw APIError.from(error);
                }

                throw error;
            }
        );

    }

    /**
     * Get server information
     * @async
     * @return {Promise<ServerInfo>} the data about the server
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
     * @param name name of the bucket
     * @param settings optional settings
     * @return {Promise<Bucket>}
     */
    async createBucket(name: string, settings?: BucketSettings): Promise<Bucket> {
        await this.httpClient.post(`/b/${name}`, settings ? BucketSettings.serialize(settings) : undefined);
        return new Bucket(name, this.httpClient);
    }

    /**
     * Get a bucket by name
     * @param name name of the bucket
     * @return {Promise<Bucket>}
     */
    async getBucket(name: string): Promise<Bucket> {
        await this.httpClient.get(`/b/${name}`);
        return new Bucket(name, this.httpClient);
    }

    /**
     * Try to create a bucket and get it if it already exists
     * @param name name of the bucket
     * @param settings optional settings
     * @return {Promise<Bucket>}
     */
    async getOrCreateBucket(name: string, settings?: BucketSettings): Promise<Bucket> {
        try {
            return await this.createBucket(name, settings);
        } catch (error) {
            if (error instanceof APIError && error.status === 409) {
                return await this.getBucket(name);
            }

            throw error; // pass exception forward
        }
    }

    /**
     * Create a new access token
     * @param name name of the token
     * @param permissions permissions for the token
     * @return {Promise<string, Date>} the token
     */

    async createToken(name: string, permissions: TokenPermissions): Promise<string> {
        const {data} = await this.httpClient.post(`/tokens/${name}`, {
            permissions: TokenPermissions.serialize(permissions)
        });

        return data.value as string;
    }

    /**
     * Get a token by name
     * @param name name of the token
     * @return {Promise<TokenInfo>} the token
     */
    async getToken(name: string): Promise<TokenInfo> {
        const {data} = await this.httpClient.get(`/tokens/${name}`);
        return TokenInfo.parse(data);
    }

    /**
     * List all tokens
     * @return {Promise<TokenInfo[]>} the list of tokens
     */
    async getTokenList(): Promise<TokenInfo[]> {
        const {data} = await this.httpClient.get("/tokens");
        return data.tokens.map((token: any) => TokenInfo.parse(token));
    }

    /**
     * Delete a token by name
     * @param name name of the token
     */
    async deleteToken(name: string): Promise<void> {
        await this.httpClient.delete(`/tokens/${name}`);
    }
}
