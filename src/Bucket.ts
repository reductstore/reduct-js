// @ts-ignore
import {AxiosInstance, AxiosResponse} from "axios";
import {BucketSettings} from "./BucketSettings";
import {BucketInfo} from "./BucketInfo";
import {EntryInfo} from "./EntryInfo";

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
        const {data} = await this.httpClient.get(`/b/${this.name}`);
        return Promise.resolve(BucketSettings.parse(data.settings));
    }

    /**
     * Set bucket settings
     * @async
     * @param settings {BucketSettings} new settings (you can set a part of settings)
     */
    async setSettings(settings: BucketSettings): Promise<void> {
        await this.httpClient.put(`/b/${this.name}`, BucketSettings.serialize(settings));
    }

    /**
     * Get information about a bucket
     * @async
     * @return {Promise<BucketInfo>}
     */
    async getInfo(): Promise<BucketInfo> {
        const {data} = await this.httpClient.get(`/b/${this.name}`);
        return BucketInfo.parse(data.info);
    }

    /**
     * Get entry list
     * @async
     * @return {Promise<EntryInfo>}
     */
    async getEntryList(): Promise<EntryInfo[]> {
        const {data} = await this.httpClient.get(`/b/${this.name}`);
        return Promise.resolve(data.entries.map((entry: any) => EntryInfo.parse(entry)));
    }

    /**
     * Remove bucket
     * @async
     * @return {Promise<void>}
     */
    async remove(): Promise<void> {
        await this.httpClient.delete(`/b/${this.name}`);
    }

    /**
     * Write a record into an entry
     * @param entry name of the entry
     * @param data {string} data as sting
     * @param ts {BigInt} timestamp in microseconds for the record. It is current time if undefined.
     */
    async write(entry: string, data: string, ts?: BigInt): Promise<void> {
        ts ||= BigInt(Date.now() * 1000);
        await this.httpClient.post(`/b/${this.name}/${entry}?ts=${ts}`, data);
    }

    /**
     * Read a record from an entry
     * @param entry name of the entry
     * @param ts {BigInt} timestamp of record in microseconds. Get the latest onr, if undefined
     */
    async read(entry: string, ts?: BigInt): Promise<string> {
        let url = `/b/${this.name}/${entry}`;
        if (ts !== undefined) {
            url += `?ts=${ts}`;
        }
        const {data} = await this.httpClient.get(url);
        return data;
    }

    /**
     * List records for a time period
     * @param entry {string} name of the entry
     * @param start {BigInt} start point of the time period
     * @param stop {BigInt} stop point of the time period
     */
    async list(entry: string, start: BigInt, stop: BigInt): Promise<{ size: BigInt, timestamp: BigInt }> {
        const {data} = await this.httpClient.get(`/b/${this.name}/${entry}/list?start=${start}&stop=${stop}`)
        return data.records.map((rec: any) => {
            return {
                size: BigInt(rec.size),
                timestamp: BigInt(rec.ts)
            };
        });
    }
}
