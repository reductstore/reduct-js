import { Client } from "../src/Client";
import { ServerInfo } from "../src/messages/ServerInfo";
import { Bucket } from "../src/Bucket";
import { QuotaType } from "../src/messages/BucketSettings";
import { cleanStorage, it_api, it_env, makeClient } from "./utils/Helpers";
import { HttpClient } from "../src/http/HttpClient";
import { Status } from "../src/messages/Status";

test("Client should raise network error", async () => {
  const client: Client = new Client("http://127.0.0.1:9999");
  console.error = jest.fn();

  await expect(client.getInfo()).rejects.toMatchObject({
    message: "fetch failed",
  });
});

test("Client should raise timeout error", async () => {
  const client: Client = new Client("http://somedomain.com", { timeout: 10 });

  await expect(client.getInfo()).rejects.toMatchObject({
    message: "timeout of 10ms exceeded",
  });
});

test("Client should raise an error with original error from http client", async () => {
  const client: Client = new Client("http://google.com:333", { timeout: 10 });

  await expect(client.getInfo()).rejects.toHaveProperty(
    "original.message",
    "This operation was aborted",
  );
});

test("HTTP client should set dispatcher when verifySSL is false", () => {
  const client = new HttpClient("http://localhost:8383", { verifySSL: false });
  expect(client["dispatcher"]).toBeDefined();
});

test("HTTP client should NOT set dispatcher when verifySSL is true", () => {
  const client = new HttpClient("http://localhost:8383", { verifySSL: true });
  expect(client["dispatcher"]).toBeUndefined();
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
    expect(info.version >= "1.10.0").toBeTruthy();

    expect(info.bucketCount).toEqual(2n);
    expect(info.usage).toEqual(82n);
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
        diskQuota: 1,
        expiryDate: 1778852143696,
        fingerprint:
          "21e2608b7d47f7fba623d714c3e14b73cd1fe3578f4010ef26bcbedfc42a4c92",
        invoice: "---",
        licensee: "ReductSoftware",
        plan: "STANDARD",
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
    buckets.forEach((bucket) => {
      expect(bucket.status).toEqual(Status.READY);
    });
  });

  it("should get bucket", async () => {
    await client.createBucket("bucket_1");

    const bucket: Bucket = await client.getBucket("bucket_1");
    expect(bucket.getName()).toEqual("bucket_1");
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

  it_api("1.12").each([QuotaType.NONE, QuotaType.FIFO, QuotaType.HARD])(
    "should create a bucket with quota type %s",
    async (quotaType) => {
      const bucket = await client.createBucket("bucket", {
        quotaType,
        quotaSize: 1024n,
      });
      await expect(bucket.getSettings()).resolves.toMatchObject({
        quotaType,
      });
    },
  );

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

    // After removal, bucket should return 404 (deleted) or 409 (being deleted)
    try {
      await client.getBucket("bucket");
      fail("Expected an error but got none");
    } catch (error: any) {
      expect([404, 409]).toContain(error.status);
    }
  });

  it("should remove a bucket with error", async () => {
    const bucket = await client.createBucket("bucket");
    await bucket.remove();

    // Trying to remove again should return 404 (deleted) or 409 (being deleted)
    try {
      await bucket.remove();
      fail("Expected an error but got none");
    } catch (error: any) {
      expect([404, 409]).toContain(error.status);
    }
  });

  it("should try to create a bucket and get when it exists", async () => {
    await client.getOrCreateBucket("bucket");
    const bucket = await client.getOrCreateBucket("bucket");
    expect(bucket.getName()).toBe("bucket");
  });
});
