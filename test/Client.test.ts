import {Client} from "../src/Client";
import {ServerInfo} from "../src/ServerInfo";
import {Bucket} from "../src/Bucket";
import {QuotaType} from "../src/BucketSettings";
import {cleanStorage, makeClient} from "./Helpers";


test("Client should raise network error", async () => {
    const client: Client = new Client("http://127.0.0.2:80");

    await expect(client.getInfo()).rejects.toEqual({
        message: "connect ECONNREFUSED 127.0.0.2:80"
    });
});

test("Client should rais timeout error", async () => {
    const client: Client = new Client("http://somedomain.xxx", {timeout: 10});

    await expect(client.getInfo()).rejects.toEqual({
        message: "timeout of 10ms exceeded",
    });
});

describe("Client", () => {
    const client: Client = makeClient();

    beforeEach((done) => {
        cleanStorage(client).then(() => done());
    });

    it("should get information about the server", async () => {
        await client.createBucket("bucket_1");
        const bucket = await client.createBucket("bucket_2");
        await bucket.write("entry", "somedata", 1000_000n);
        await bucket.write("entry", "somedata", 2000_000n);

        const info: ServerInfo = await client.getInfo();
        expect(info.version).toMatch(/0\.[0-9]+\.[0-9]+/);

        expect(info.bucketCount).toEqual(2n);
        expect(info.usage).toEqual(16n);
        expect(info.uptime).toBeGreaterThanOrEqual(0);
        expect(info.oldestRecord).toEqual(1000_000n);
        expect(info.latestRecord).toEqual(2000_000n);

        expect(info.defaults.bucket).toEqual({
            maxBlockSize: 67108864n,
            quotaSize: 0n,
            quotaType: QuotaType.NONE,
        });
    });

    it("should get list of buckets", async () => {
        await client.createBucket("bucket_1");
        await client.createBucket("bucket_2");

        const buckets = await client.getBucketList();

        expect(buckets.length).toBeGreaterThanOrEqual(2);
        expect(buckets.map((bucket) => bucket.name)).toContain("bucket_1");
        expect(buckets.map((bucket) => bucket.name)).toContain("bucket_2");
    });

    it("should get bucket", async () => {
        await client.createBucket("bucket_1");

        const bucket: Bucket = await client.getBucket("bucket_1");
        expect(bucket.name).toEqual("bucket_1");
    });

    it("should get bucket with error", async () => {
        await expect(client.getBucket("NOTEXIST")).rejects.toEqual({
            status: 404,
            message: "Request failed with status code 404: Bucket 'NOTEXIST' is not found"
        });
    });

    it("should create a bucket if default settings", async () => {
        const bucket = await client.createBucket("bucket");
        await expect(bucket.getSettings()).resolves.toEqual({
            maxBlockSize: 67108864n,
            quotaSize: 0n,
            quotaType: QuotaType.NONE
        });
    });

    it("should create a bucket if custom settings", async () => {
        const bucket = await client.createBucket("bucket", {quotaType: QuotaType.FIFO, quotaSize: 1024n});
        await expect(bucket.getSettings()).resolves.toEqual({
            maxBlockSize: 67108864n,
            quotaSize: 1024n,
            quotaType: QuotaType.FIFO
        });
    });

    it("should create a bucket with error", async () => {
        await client.createBucket("bucket");
        await expect(client.createBucket("bucket")).rejects.toEqual({
            status: 409,
            message: "Request failed with status code 409: Bucket 'bucket' already exists",
        });
    });

    it("should remove a bucket", async () => {
        const bucket = await client.createBucket("bucket");
        await bucket.remove();
        await expect(client.getBucket("bucket")).rejects.toMatchObject({status: 404});
    });

    it("should remove a bucket with error", async () => {
        const bucket = await client.createBucket("bucket");
        await bucket.remove();
        await expect(bucket.remove()).rejects.toMatchObject({status: 404});
    });

    it("should try to create a bucket and get when it exists", async () => {
        await client.getOrCreateBucket("bucket");
        const bucket = await client.getOrCreateBucket("bucket");
        expect(bucket.name).toBe("bucket");
    });
});
