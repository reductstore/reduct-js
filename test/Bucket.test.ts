import {Client} from "../src/Client";
import {Bucket} from "../src/Bucket";
import {cleanStorage} from "./Helpers";
import {BucketInfo} from "../src/BucketInfo";

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
});
