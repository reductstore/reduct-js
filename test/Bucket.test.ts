import {Client} from "../src/Client";
import {Bucket} from "../src/Bucket";
import {cleanStorage} from "./Helpers";
import {BucketInfo} from "../src/BucketInfo";
import {QuotaType} from "../src/BucketSettings";

describe("Bucket", () => {
    const client = new Client("http://127.0.0.1:8383");

    beforeEach((done) => {
        cleanStorage(client).then(() =>
            client.createBucket("bucket").then((bucket: Bucket) =>
                Promise.all([
                    bucket.write("entry-1", "somedata1", new Date(1000)),
                    bucket.write("entry-2", "somedata2", new Date(2000)),
                    bucket.write("entry-2", "somedata3", new Date(3000))
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
            maxBlockSize: 67108864n,
            quotaSize: 0n,
            quotaType: QuotaType.NONE
        });

        await bucket.setSettings({maxBlockSize: 0n});
        await expect(bucket.getSettings()).resolves.toEqual({
            maxBlockSize: 0n,
            // quotaSize: 0n,  TODO: Bug in storage
            // quotaType: QuotaType.NONE
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
        await (expect(bucket.read("entry-2"))).resolves.toEqual("somedata3");
    });

    it("should read a record by timestamp", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await (expect(bucket.read("entry-2", new Date(2000)))).resolves.toEqual("somedata2");
    });

    it("should read a record with error if timestamp is wrong", async () => {
        const bucket: Bucket = await client.getBucket("bucket");
        await (expect(bucket.read("entry-2", new Date(100000)))).rejects.toMatchObject({status: 404});
    });
});
