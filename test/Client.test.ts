import {Client} from "../src/Client";
import {ServerInfo} from "../src/ServerInfo";
import {BucketInfo} from "../src/BucketInfo";
import {Bucket} from "../src/Bucket";


test("Client should raise network error", () => {
    const client = new Client("http://127.0.0.2:80");
    expect(client.getInfo()).rejects.toEqual({
        message: "connect ECONNREFUSED 127.0.0.2:80"
    });
});

describe("Client", () => {
    const client = new Client("http://127.0.0.1:8383");

    beforeAll(async () => {
        const buckets: BucketInfo[] = await client.getBucketList();
        buckets.forEach(info => {
            client.getBucket(info.name).then((bucket: Bucket) => bucket.remove());
        });
    });

    it("should get information about the server", async () => {
        const info: ServerInfo = await client.getInfo();

        expect(info.version).toMatch(/0\.[0-9]+\.[0-9]+/);
        expect(info.bucketCount).toBeGreaterThanOrEqual(0);
        expect(info.usage).toBeGreaterThanOrEqual(0);
        expect(info.uptime).toBeGreaterThanOrEqual(0);
        expect(info.oldestRecord).toBeGreaterThanOrEqual(0);
        expect(info.latestRecord).toBeGreaterThanOrEqual(0);
    });

    it("should get list of buckets", async () => {
        await client.createBucket("bucket_1");
        await client.createBucket("bucket_2");

        const buckets = await client.getBucketList();

        expect(buckets.length).toBeGreaterThanOrEqual(2);
        expect(buckets.map((bucket) => bucket.name)).toContain("bucket_1");
        expect(buckets.map((bucket) => bucket.name)).toContain("bucket_2");
    });
});
