/**
 * Represents HTTP Client for Reduct Storage API
 * @class
 */
import {ServerInfo} from "./ServerInfo";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import axios, {AxiosInstance, AxiosResponse} from "axios";

export class Client {
    private httpClient: AxiosInstance;

    /**
     * Create a client
     * @param url URL to the storage
     */
    constructor(url: string) {
        this.httpClient = axios.create({
            baseURL: url,
            timeout: 1000
        })
    }

    /**
     * Get server information
     * @see ServerInfo
     */
    async getInfo(): Promise<ServerInfo> {
        return this.httpClient.get("/info").then((resp: AxiosResponse) => {
            const data = resp.data;
            const info: ServerInfo = {
                version: data.version,
                bucket_count: BigInt(data.bucket_count),
                uptime: BigInt(data.uptime),
                usage: BigInt(data.usage),
                oldest_record: BigInt(data.oldest_record),
                latest_record: BigInt(data.latest_record),
            }

            return Promise.resolve(info);
        })
    }
}
