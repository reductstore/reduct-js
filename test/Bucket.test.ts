import crypto from "crypto";
import {Buffer} from "buffer";
import md5 from "md5";
import * as Stream from "stream";
// @ts-ignore
import all from "it-all";
// @ts-ignore
import request from "sync-request";

import {Client} from "../src/Client";
import {Bucket} from "../src/Bucket";
import {cleanStorage, makeClient} from "./Helpers";
import {BucketInfo} from "../src/BucketInfo";
import {BucketSettings, QuotaType} from "../src/BucketSettings";
import {ReadableRecord} from "../src/Record";

const it_api = (version: string) => {
    const resp = request("HEAD", "http://localhost:8383/api/v1/alive");
    if (resp.headers["x-reduct-api"] >= version) {
        return it;
    } else {
        return it.skip;
    }
};

describe("Bucket", () => {
    const client: Client = makeClient();

    beforeEach((done) => {
        cleanStorage(client).then(() =>
            client.createBucket("bucket", {
                maxBlockSize: 64000000n,
                maxBlockRecords: 256n,
                quotaSize: 0n,
                quotaType: QuotaType.NONE
            }).then(async (bucket: Bucket) => {
                let rec = await bucket.beginWrite("entry-1", 1000_000n);
                await rec.write("somedata1");

                rec = await bucket.beginWrite("entry-2", 2000_000n);
                await rec.write("somedata2");

                rec = await bucket.beginWrite("entry-2", 3000_000n);
                await rec.write("somedata3");
            })).then(() => done());
    });

    it("should get info about bucket", async () => {
        const bucket = await client.getBucket("bucket");
        const info: BucketInfo = await bucket.getInfo();

        expect(info.name).toEqual("bucket");
        expect(info.size).toEqual(27n);
        expect(info.entryCount).toEqual(2n);
        expect(info.oldestRecord).toEqual(1000_000n);
        expect(info.latestRecord).toEqual(3000_000n);
    });

    it("should get/set settings", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await expect(bucket.getSettings()).resolves.toEqual({
            maxBlockSize: 64000000n,
            maxBlockRecords: 256n,
            quotaSize: 0n,
            quotaType: QuotaType.NONE
        });

        await bucket.setSettings({maxBlockRecords: 1024n, quotaType: QuotaType.FIFO});
        await expect(bucket.getSettings()).resolves.toEqual({
            maxBlockSize: 64000000n,
            maxBlockRecords: 1024n,
            quotaSize: 0n,
            quotaType: QuotaType.FIFO
        });
    });


    it("should get list of entries", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await (expect(bucket.getEntryList())).resolves.toEqual([{
            blockCount: 1n,
            latestRecord: 1000000n,
            name: "entry-1",
            oldestRecord: 1000000n,
            recordCount: 1n,
            size: 9n
        }, {
            blockCount: 1n,
            latestRecord: 3000000n,
            name: "entry-2",
            oldestRecord: 2000000n,
            recordCount: 2n,
            size: 18n
        }]);
    });

    it("should read latest record", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        const record = await bucket.beginRead("entry-2");

        expect(record).toMatchObject({size: 9n, time: 3000000n, last: true});
        expect((await record.read()).toString()).toEqual("somedata3");
    });

    it.each([[false, "somedata2"], [true, ""]])("should read a record by timestamp (head=%p)", async (head: boolean, content: string) => {
        const bucket: Bucket = await client.getBucket("bucket");
        const record = await bucket.beginRead("entry-2", 2000000n, head);

        expect(record).toMatchObject({size: 9n, time: 2000000n, last: true});
        expect(await record.read()).toEqual(Buffer.from(content, "ascii"));
    });

    it("should read a record with error if timestamp is wrong", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await (expect(bucket.beginRead("entry-2", 10000_000n))).rejects.toMatchObject({status: 404});
    });

    it("should write and read a big blob as streams", async () => {
        const bigBlob = crypto.randomBytes(2 ** 20);

        const bucket: Bucket = await client.getBucket("bucket");
        const record = await bucket.beginWrite("big-blob");
        await record.write(Stream.Readable.from(bigBlob), bigBlob.length);

        const readStream: Stream = (await bucket.beginRead("big-blob")).stream;

        const actual: Buffer = await new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            readStream.on("data", (chunk: Buffer) => chunks.push(chunk));
            readStream.on("error", (err: Error) => reject(err));
            readStream.on("end", () => resolve(Buffer.concat(chunks)));
        });

        expect(actual.length).toEqual(bigBlob.length);
        expect(md5(actual)).toEqual(md5(bigBlob));
    });

    it("should write and read a big blob as buffers", async () => {
        const bigBlob = crypto.randomBytes(2 ** 20);

        const bucket: Bucket = await client.getBucket("bucket");
        const record = await bucket.beginWrite("big-blob");
        await record.write(bigBlob);

        const reader = await bucket.beginRead("big-blob");

        const actual: Buffer = await reader.read();
        expect(actual.length).toEqual(bigBlob.length);
        expect(md5(actual)).toEqual(md5(bigBlob));
    });

    it("should read write and read labels along with records", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        const record = await bucket.beginWrite("entry-1", {labels: {label1: "label1", label2: 100n, label3: true}});
        await record.write("somedata1");

        const readRecord = await bucket.beginRead("entry-1");
        expect(readRecord.labels).toEqual({label1: "label1", label2: "100", label3: "true"});
    });

    it("should read and write content type of records", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        const record = await bucket.beginWrite("entry-1", {contentType: "text/plain"});
        await record.write("somedata1");

        const readRecord = await bucket.beginRead("entry-1");
        expect(readRecord.contentType).toEqual("text/plain");
    });

    it.each([
        [false, ["somedata2", "somedata3"]],
        [true, ["", ""]]
    ])("should query records head=%p", async (head: boolean, contents: string[]) => {
        const bucket: Bucket = await client.getBucket("bucket");
        const records: ReadableRecord[] = await all(bucket.query("entry-2", undefined, undefined, {
            head,
        }));

        expect(records.length).toEqual(2);
        expect(records[0].time).toEqual(2_000_000n);
        expect(records[0].size).toEqual(9n);
        expect(await records[0].read()).toEqual(Buffer.from(contents[0], "ascii"));

        expect(records[1].time).toEqual(3_000_000n);
        expect(records[1].size).toEqual(9n);
        expect(await records[1].read()).toEqual(Buffer.from(contents[1], "ascii"));
    });

    it("should query records with parameters", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        let records: ReadableRecord[] = await all(bucket.query("entry-2", 3_000_000n));
        expect(records.length).toEqual(1);

        records = await all(bucket.query("entry-2", 2_000_000n, 2_000_001n));
        expect(records.length).toEqual(1);


        await expect(all(bucket.query("entry-2", undefined, undefined, 0)))
            .rejects.toHaveProperty("status", 404);
    });

    it("should query records with labels", async () => {
        const bucket: Bucket = await client.getBucket("bucket");

        let record = await bucket.beginWrite("entry-labels", {labels: {label1: "value1", label2: "value2"}});
        await record.write("somedata1");
        record = await bucket.beginWrite("entry-labels", {labels: {label1: "value1", label2: "value3"}});
        await record.write("somedata1");

        let records: ReadableRecord[] = await all(bucket.query("entry-labels", undefined, undefined,
            {
                include: {label1: "value1", label2: "value2"},
            }));
        expect(records.length).toEqual(1);
        expect(records[0].labels).toEqual({label1: "value1", label2: "value2"});

        records = await all(bucket.query("entry-labels", undefined, undefined,
            {
                exclude: {label1: "value1", label2: "value2"},
            }));
        expect(records.length).toEqual(1);
        expect(records[0].labels).toEqual({label1: "value1", label2: "value3"});
    });

    it_api("1.6")("should remove entry", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await bucket.removeEntry("entry-1");
        await expect(bucket.beginRead("entry-1")).rejects.toMatchObject({status: 404});
    });

});
