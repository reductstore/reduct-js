import crypto from "crypto";
import {Buffer} from "buffer";
import md5 from "md5";
import * as Stream from "stream";
// @ts-ignore
import all from "it-all";

import {Client} from "../src/Client";
import {Bucket} from "../src/Bucket";
import {cleanStorage, makeClient} from "./Helpers";
import {BucketInfo} from "../src/BucketInfo";
import {QuotaType} from "../src/BucketSettings";


import {Record} from "../src/Record";

describe("Bucket", () => {
    const client: Client = makeClient();

    beforeEach((done) => {
        cleanStorage(client).then(() =>
            client.createBucket("bucket").then((bucket: Bucket) =>
                Promise.all([
                    bucket.write("entry-1", "somedata1", 1000_000n),
                    bucket.write("entry-2", "somedata2", 2000_000n),
                    bucket.write("entry-2", "somedata3", 3000_000n)
                ])
            )).then(() => done());

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
            maxBlockRecords: 1024n,
            quotaSize: 0n,
            quotaType: QuotaType.NONE
        });

        await bucket.setSettings({maxBlockSize: 0n});
        await expect(bucket.getSettings()).resolves.toEqual({
            maxBlockSize: 0n,
            maxBlockRecords: 1024n,
            quotaSize: 0n,
            quotaType: QuotaType.NONE
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
        await (expect(bucket.read("entry-2"))).resolves.toEqual(Buffer.from("somedata3", "ascii"));
    });

    it("should read a record by timestamp", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await (expect(bucket.read("entry-2", 2000_000n))).resolves.toEqual(Buffer.from("somedata2", "ascii"));
    });

    it("should read a record with error if timestamp is wrong", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await (expect(bucket.read("entry-2", 10000_000n))).rejects.toMatchObject({status: 404});
    });

    it("should list record in a entry", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await (expect(bucket.list("entry-2", 0n, 4000_000n))).resolves.toEqual([
            {size: 9n, timestamp: 2000_000n},
            {size: 9n, timestamp: 3000_000n}
        ]);
    });

    it("should write and read a big blob as streams", async () => {
        const bigBlob = crypto.randomBytes(2 ** 20);

        const bucket: Bucket = await client.getBucket("bucket");
        await bucket.writeStream("big-blob", Stream.Readable.from(bigBlob), bigBlob.length);

        const readStream: Stream = await bucket.readStream("big-blob");

        const actual: Buffer = await new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            readStream.on("data", (chunk: Buffer) => chunks.push(chunk));
            readStream.on("error", (err: Error) => reject(err));
            readStream.on("end", () => resolve(Buffer.concat(chunks)));
        });

        expect(actual.length).toEqual(bigBlob.length);
        expect(md5(actual)).toEqual(md5(bigBlob));
    });

    it("should query records", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        const records: Record[] = await all(bucket.query("entry-2"));

        expect(records.length).toEqual(2);
        expect(records[0].time).toEqual(2_000_000n);
        expect(records[0].size).toEqual(9n);
        expect(await records[0].read()).toEqual(Buffer.from("somedata2", "ascii"));

        expect(records[1].time).toEqual(3_000_000n);
        expect(records[1].size).toEqual(9n);
        expect(await records[1].read()).toEqual(Buffer.from("somedata3", "ascii"));
    });

    it("should query records with parameters", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        let records: Record[] = await all(bucket.query("entry-2", 3_000_000n));
        expect(records.length).toEqual(1);

        records = await all(bucket.query("entry-2", 2_000_000n, 2_000_001n));
        expect(records.length).toEqual(1);


        await expect(all(bucket.query("entry-2", undefined, undefined, 0)))
            .rejects.toHaveProperty("status", 404);
    });

});
