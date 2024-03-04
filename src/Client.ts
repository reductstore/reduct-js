/**
 * Represents HTTP Client for ReductStore API
 * @class
 */
import {ServerInfo} from "./messages/ServerInfo";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require("axios").default;
import {APIError} from "./APIError";
import {BucketInfo} from "./messages/BucketInfo";
import {BucketSettings} from "./messages/BucketSettings";
import {Bucket} from "./Bucket";
import {Token, TokenPermissions} from "./messages/Token";
import {Readable} from "stream";
import {Buffer} from "buffer";
import {FullReplicationInfo, ReplicationInfo} from "./messages/ReplicationInfo";
import {ReplicationSettings} from "./messages/ReplicationSettings";
// @ts-ignore
import {AxiosError, AxiosInstance, AxiosResponse} from "axios";
import * as https from "https";

/**
 * Options
 */
export type ClientOptions = {
    apiToken?: string;   // API token for authentication
    timeout?: number;    // communication timeout
    verifySSL?: boolean; // verify SSL certificate
}

export class Client {
    private readonly httpClient: AxiosInstance;

    /**
     * HTTP Client for ReductStore
     * @param url URL to the storage
     * @param options
     */
    constructor(url: string, options: ClientOptions = {}) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const bigJson = require("json-bigint")({
                alwaysParseAsBig: true,
                useNativeBigInt: true,
            }
        );

        // http client with big int support in JSON
        this.httpClient = axios.create({
            baseURL: `${url}/api/v1`,
            timeout: options.timeout,
            httpsAgent: new https.Agent({
                rejectUnauthorized: options.verifySSL !== false
            }),

            headers: {
                "Authorization": `Bearer ${options.apiToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            transformRequest: [(data: any) => {
                // very ugly hack to support big int in JSON
                if (typeof data !== "object" || data instanceof Readable || data instanceof Buffer) {
                    return data;
                }
                return bigJson.stringify(data);
            }],
            transformResponse: [(data: any) => {
                // very ugly hack to support big int in JSON
                if (typeof data !== "string") {
                    return data;
                }

                if (data.length == 0) {
                    return {};
                }
                return bigJson.parse(data);
            }]
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
     * @return {Promise<string>} the token
     *
     * @example
     * const token = await client.createToken("my-token", {fullAccess: true});
     * const client = new Client("https://play.storage-reduct.dev", {apiToken: token});
     */

    async createToken(name: string, permissions: TokenPermissions): Promise<string> {
        const {data} = await this.httpClient.post(`/tokens/${name}`, TokenPermissions.serialize(permissions));
        return data.value as string;
    }

    /**
     * Get a token by name
     * @param name name of the token
     * @return {Promise<Token>} the token
     */
    async getToken(name: string): Promise<Token> {
        const {data} = await this.httpClient.get(`/tokens/${name}`);
        return Token.parse(data);
    }

    /**
     * List all tokens
     * @return {Promise<Token[]>} the list of tokens
     */
    async getTokenList(): Promise<Token[]> {
        const {data} = await this.httpClient.get("/tokens");
        return data.tokens.map((token: any) => Token.parse(token));
    }

    /**
     * Delete a token by name
     * @param name name of the token
     */
    async deleteToken(name: string): Promise<void> {
        await this.httpClient.delete(`/tokens/${name}`);
    }

    /**
     * Get current API token and its permissions
     * @return {Promise<Token>} the token
     */
    async me(): Promise<Token> {
        const {data} = await this.httpClient.get("/me");
        return Token.parse(data);
    }

    /**
     * Get the list of replications
     * @return {Promise<ReplicationInfo[]>} the list of replications
     */
    async getReplicationList(): Promise<ReplicationInfo[]> {
        const {data} = await this.httpClient.get("/replications") as {
            data: { replications: ReplicationInfo[] }
        };
        return data.replications.map((replication: any) => ReplicationInfo.parse(replication));
    }

    /**
     * Get full information about a replication
     * @param name name of the replication
     * @return {Promise<FullReplicationInfo>} the replication
     */
    async getReplication(name: string): Promise<FullReplicationInfo> {
        const {data} = await this.httpClient.get(`/replications/${name}`);
        return FullReplicationInfo.parse(data);
    }

    /**
     * Create a new replication
     * @param name name of the replication
     * @param settings settings of the replication
     * @return {Promise<void>}
     */
    async createReplication(name: string, settings: ReplicationSettings): Promise<void> {
        await this.httpClient.post(`/replications/${name}`, ReplicationSettings.serialize(settings));
    }

    /**
     * Update a replication
     * @param name name of the replication
     * @param settings settings of the replication
     * @return {Promise<void>}
     */
    async updateReplication(name: string, settings: ReplicationSettings): Promise<void> {
        await this.httpClient.put(`/replications/${name}`, ReplicationSettings.serialize(settings));
    }

    /**
     * Delete a replication
     * @param name name of the replication
     * @return {Promise<void>}
     */
    async deleteReplication(name: string): Promise<void> {
        await this.httpClient.delete(`/replications/${name}`);
    }
}
