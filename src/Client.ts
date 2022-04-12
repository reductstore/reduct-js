/**
 * Represents HTTP Client for Reduct Storage API
 * @class
 */
import {ServerInfo} from './ServerInfo';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import axios, {AxiosInstance, AxiosResponse, AxiosError} from 'axios';
import {APIError} from './APIError';

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
        });
    }

    /**
     * Get server information
     * @see ServerInfo
     * @async
     * @return {Promise<ServerInfo>} The data about the server
     */
    async getInfo(): Promise<ServerInfo> {
        return this.httpClient.get('/info').then((resp: AxiosResponse) => {
            const {data} = resp;
            const info: ServerInfo = {
                version: data.version,
                bucket_count: BigInt(data.bucket_count),
                uptime: BigInt(data.uptime),
                usage: BigInt(data.usage),
                oldest_record: BigInt(data.oldest_record),
                latest_record: BigInt(data.latest_record),
            };

            return Promise.resolve(info);
        }).catch((error: AxiosError) => {
            return Promise.reject(APIError.from(error));
        });
    }
}
