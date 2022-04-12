import {Client} from "../src/Client";
import {Bucket} from "../src/Bucket";
import {cleanStorage} from "./Helpers";
import {BucketInfo} from "../src/BucketInfo";
import {QuotaType} from "../src/BucketSettings";

describe("Bucket", () => {
    const client = new Client("http://127.0.0.1:8383");

    beforeEach((done) => {
        cleanStorage(client).then(() => done());
    });

    it("should get info about bucket", async () => {
        const bucket: Bucket = await client.createBucket("bucket");
        const info: BucketInfo = await bucket.getInfo();

        expect(info.name).toEqual("bucket");
        expect(info.size).toEqual(0n);
        expect(info.entryCount).toEqual(0n);
        expect(info.oldestRecord).toBeGreaterThanOrEqual(0n);
        expect(info.latestRecord).toEqual(0n);
    });

    it ("should get/set settings", async () => {
        const bucket: Bucket = await client.createBucket("bucket");
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
});
