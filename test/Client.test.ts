import { Client } from "../src/Client";
import { ServerInfo } from "../src/messages/ServerInfo";
import { Bucket } from "../src/Bucket";
import { QuotaType } from "../src/messages/BucketSettings";
import { cleanStorage, it_env, makeClient } from "./Helpers";

test("Client should raise network error", async () => {
  const client: Client = new Client("http://127.0.0.2:80");

  await expect(client.getInfo()).rejects.toMatchObject({
    message: "connect ECONNREFUSED 127.0.0.2:80",
  });
});

test("Client should raise timeout error", async () => {
  const client: Client = new Client("http://somedomain.xxx", { timeout: 10 });

  await expect(client.getInfo()).rejects.toMatchObject({
    message: "timeout of 10ms exceeded",
  });
});

test("Client should raise an error with original error from http client", async () => {
  const client: Client = new Client("http://google.com:333", { timeout: 10 });

  await expect(client.getInfo()).rejects.toMatchObject({
    original: {
      message: "timeout of 10ms exceeded",
      code: "ECONNABORTED",
      name: "AxiosError",
    },
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
    let rec = await bucket.beginWrite("entry", 1000_000n);
    await rec.write("somedata");

    rec = await bucket.beginWrite("entry", 2000_000n);
    await rec.write("somedata");

    const info: ServerInfo = await client.getInfo();
    expect(info.version >= "1.2.0").toBeTruthy();

    expect(info.bucketCount).toEqual(2n);
    expect(info.usage).toEqual(102n);
    expect(info.uptime).toBeGreaterThanOrEqual(0);
    expect(info.oldestRecord).toEqual(1000_000n);
    expect(info.latestRecord).toEqual(2000_000n);

    expect(info.defaults.bucket).toMatchObject({
      quotaSize: 0n,
      quotaType: QuotaType.NONE,
    });
  });

  it_env("RS_LICENSE_PATH")(
    "should get information about the server with license",
    async () => {
      const info: ServerInfo = await client.getInfo();
      expect(info.license).toEqual({
        deviceNumber: 1,
        diskQuota: 0,
        expiryDate: Date.parse("2035-01-01T00:00:00.000Z"),
        fingerprint:
          "df92c95a7c9b56c2af99b290c39d8471c3e6cbf9dc33dc9bdb4116b98d465cc9",
        invoice: "xxxxxx",
        licensee: "ReductStore,LLC",
        plan: "UNLIMITED",
      });
    },
  );

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
    await expect(client.getBucket("NOTEXIST")).rejects.toMatchObject({
      status: 404,
      message: "Bucket 'NOTEXIST' is not found",
    });
  });

  it("should create a bucket with default settings", async () => {
    const bucket = await client.createBucket("bucket");
    await expect(bucket.getSettings()).resolves.toMatchObject({
      maxBlockSize: 64000000n,
      quotaSize: 0n,
      quotaType: QuotaType.NONE,
    });
  });

  it("should create a bucket if custom settings", async () => {
    const bucket = await client.createBucket("bucket", {
      quotaType: QuotaType.FIFO,
      quotaSize: 1024n,
      maxBlockRecords: 1029n,
    });
    await expect(bucket.getSettings()).resolves.toEqual({
      maxBlockSize: 64000000n,
      maxBlockRecords: 1029n,
      quotaSize: 1024n,
      quotaType: QuotaType.FIFO,
    });
  });

  it("should create a bucket with error", async () => {
    await client.createBucket("bucket");
    await expect(client.createBucket("bucket")).rejects.toMatchObject({
      status: 409,
      message: "Bucket 'bucket' already exists",
    });
  });

  it("should remove a bucket", async () => {
    const bucket = await client.createBucket("bucket");
    await bucket.remove();
    await expect(client.getBucket("bucket")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("should remove a bucket with error", async () => {
    const bucket = await client.createBucket("bucket");
    await bucket.remove();
    await expect(bucket.remove()).rejects.toMatchObject({ status: 404 });
  });

  it("should try to create a bucket and get when it exists", async () => {
    await client.getOrCreateBucket("bucket");
    const bucket = await client.getOrCreateBucket("bucket");
    expect(bucket.name).toBe("bucket");
  });
});
