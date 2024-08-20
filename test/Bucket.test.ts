import crypto from "crypto";
import { Buffer } from "buffer";
import md5 from "md5";
import * as Stream from "stream";
// @ts-ignore
import all from "it-all";

import { Client } from "../src/Client";
import { Bucket } from "../src/Bucket";
import { cleanStorage, it_api, makeClient } from "./Helpers";
import { BucketInfo } from "../src/messages/BucketInfo";
import { QuotaType } from "../src/messages/BucketSettings";
import { ReadableRecord } from "../src/Record";
import { APIError } from "../src/APIError";

describe("Bucket", () => {
  const client: Client = makeClient();

  beforeEach((done) => {
    cleanStorage(client)
      .then(() =>
        client
          .createBucket("bucket", {
            maxBlockSize: 64000000n,
            maxBlockRecords: 256n,
            quotaSize: 0n,
            quotaType: QuotaType.NONE,
          })
          .then(async (bucket: Bucket) => {
            let rec = await bucket.beginWrite("entry-1", {
              ts: 1000_000n,
              labels: { label1: "label1", label2: 100n, label3: true },
            });
            await rec.write("somedata1");

            rec = await bucket.beginWrite("entry-2", 2000_000n);
            await rec.write("somedata2");

            rec = await bucket.beginWrite("entry-2", 3000_000n);
            await rec.write("somedata3");

            rec = await bucket.beginWrite("entry-2", 4000_000n);
            await rec.write("somedata4");
          }),
      )
      .then(() => done());
  });

  it("should get info about bucket", async () => {
    const bucket = await client.getBucket("bucket");
    const info: BucketInfo = await bucket.getInfo();

    expect(info.name).toEqual("bucket");
    expect(info.size).toEqual(217n);
    expect(info.entryCount).toEqual(2n);
    expect(info.oldestRecord).toEqual(1000_000n);
    expect(info.latestRecord).toEqual(4000_000n);
  });

  it("should get/set settings", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    await expect(bucket.getSettings()).resolves.toEqual({
      maxBlockSize: 64000000n,
      maxBlockRecords: 256n,
      quotaSize: 0n,
      quotaType: QuotaType.NONE,
    });

    await bucket.setSettings({
      maxBlockRecords: 1024n,
      quotaType: QuotaType.FIFO,
    });
    await expect(bucket.getSettings()).resolves.toEqual({
      maxBlockSize: 64000000n,
      maxBlockRecords: 1024n,
      quotaSize: 0n,
      quotaType: QuotaType.FIFO,
    });
  });

  it("should get list of entries", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    await expect(bucket.getEntryList()).resolves.toEqual([
      {
        blockCount: 1n,
        latestRecord: 1000000n,
        name: "entry-1",
        oldestRecord: 1000000n,
        recordCount: 1n,
        size: 90n,
      },
      {
        blockCount: 1n,
        latestRecord: 4000000n,
        name: "entry-2",
        oldestRecord: 2000000n,
        recordCount: 3n,
        size: 127n,
      },
    ]);
  });

  it("should read latest record", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const record = await bucket.beginRead("entry-2");

    expect(record).toMatchObject({ size: 9n, time: 4000000n, last: true });
    expect((await record.read()).toString()).toEqual("somedata4");
  });

  it.each([
    [false, "somedata2"],
    [true, ""],
  ])(
    "should read a record by timestamp (head=%p)",
    async (head: boolean, content: string) => {
      const bucket: Bucket = await client.getBucket("bucket");
      const record = await bucket.beginRead("entry-2", 2000000n, head);

      expect(record).toMatchObject({ size: 9n, time: 2000000n, last: true });
      expect(await record.read()).toEqual(Buffer.from(content, "ascii"));
    },
  );

  it("should read a record with error if timestamp is wrong", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    await expect(bucket.beginRead("entry-2", 10000_000n)).rejects.toMatchObject(
      { status: 404 },
    );
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

  it("should query batched big blobs", async () => {
    const bigBlob1 = crypto.randomBytes(16_000_000);
    const bigBlob2 = crypto.randomBytes(16_000_000);

    const bucket: Bucket = await client.getBucket("bucket");
    let record = await bucket.beginWrite("big-blob");
    await record.write(bigBlob1);

    record = await bucket.beginWrite("big-blob");
    await record.write(bigBlob2);

    const blobs = await all(bucket.query("big-blob"));

    expect(blobs.length).toEqual(2);
    expect(md5(await blobs[0].read())).toEqual(md5(bigBlob1));
    expect(md5(await blobs[1].read())).toEqual(md5(bigBlob2));
  });

  it("should read write and read labels along with records", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const record = await bucket.beginWrite("entry-1", {
      labels: { label1: "label1", label2: 100n, label3: true },
    });
    await record.write("somedata1");

    const readRecord = await bucket.beginRead("entry-1");
    expect(readRecord.labels).toEqual({
      label1: "label1",
      label2: "100",
      label3: "true",
    });
  });

  it("should read and write content type of records", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const record = await bucket.beginWrite("entry-1", {
      contentType: "text/plain",
    });
    await record.write("somedata1");

    const readRecord = await bucket.beginRead("entry-1");
    expect(readRecord.contentType).toEqual("text/plain");
  });

  it_api("1.11")("should update labels", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const ts = 1000_000n;

    await bucket.update("entry-1", ts, { label1: "label1", label2: "" });
    const readRecord = await bucket.beginRead("entry-1", ts);
    expect(readRecord.labels).toEqual({
      label1: "label1",
      label3: "true",
    });
  });

  it.each([
    [false, ["somedata2", "somedata3"]],
    [true, ["", ""]],
  ])(
    "should query records head=%p",
    async (head: boolean, contents: string[]) => {
      const bucket: Bucket = await client.getBucket("bucket");
      const records: ReadableRecord[] = await all(
        bucket.query("entry-2", undefined, undefined, {
          head,
        }),
      );

      expect(records.length).toEqual(3);
      expect(records[0].time).toEqual(2_000_000n);
      expect(records[0].size).toEqual(9n);
      expect(await records[0].read()).toEqual(
        Buffer.from(contents[0], "ascii"),
      );

      expect(records[1].time).toEqual(3_000_000n);
      expect(records[1].size).toEqual(9n);
      expect(await records[1].read()).toEqual(
        Buffer.from(contents[1], "ascii"),
      );
    },
  );

  it("should query records with parameters", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    let records: ReadableRecord[] = await all(
      bucket.query("entry-2", 3_000_000n),
    );
    expect(records.length).toEqual(2);

    records = await all(bucket.query("entry-2", 2_000_000n, 2_000_001n));
    expect(records.length).toEqual(1);

    await expect(
      all(bucket.query("entry-2", undefined, undefined, 0)),
    ).rejects.toHaveProperty("status", 404);
  });

  it_api("1.6")("should query limited number of query", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const records: ReadableRecord[] = await all(
      bucket.query("entry-2", 0n, undefined, { limit: 1 }),
    );
    expect(records.length).toEqual(1);
  });

  it_api("1.10")("should query a record each 2 s", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const records: ReadableRecord[] = await all(
      bucket.query("entry-2", 0n, undefined, { eachS: 2.0 }),
    );
    expect(records.length).toEqual(2);
    expect(records[0].time).toEqual(2_000_000n);
    expect(records[1].time).toEqual(4_000_000n);
  });

  it_api("1.10")("should query each 3d record", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const records: ReadableRecord[] = await all(
      bucket.query("entry-2", 0n, undefined, { eachN: 3 }),
    );
    expect(records.length).toEqual(1);
    expect(records[0].time).toEqual(2_000_000n);
  });

  it("should query records with labels", async () => {
    const bucket: Bucket = await client.getBucket("bucket");

    let record = await bucket.beginWrite("entry-labels", {
      labels: { label1: "value1", label2: "value2" },
    });
    await record.write("somedata1");
    record = await bucket.beginWrite("entry-labels", {
      labels: { label1: "value1", label2: "value3" },
    });
    await record.write("somedata1");

    let records: ReadableRecord[] = await all(
      bucket.query("entry-labels", undefined, undefined, {
        include: { label1: "value1", label2: "value2" },
      }),
    );
    expect(records.length).toEqual(1);
    expect(records[0].labels).toEqual({ label1: "value1", label2: "value2" });

    records = await all(
      bucket.query("entry-labels", undefined, undefined, {
        exclude: { label1: "value1", label2: "value2" },
      }),
    );
    expect(records.length).toEqual(1);
    expect(records[0].labels).toEqual({ label1: "value1", label2: "value3" });
  });

  it_api("1.6")("should remove entry", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    await bucket.removeEntry("entry-1");
    await expect(bucket.beginRead("entry-1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("should write a batch of records", async () => {
    const bucket: Bucket = await client.getBucket("bucket");
    const batch = await bucket.beginWriteBatch("entry-10");
    batch.add(1000n, "somedata1");
    batch.add(2000n, "somedata2", "text/plain");
    batch.add(3000n, "somedata3", undefined, {
      label1: "value1",
      label2: "value2",
    });
    await batch.write();

    const records: ReadableRecord[] = await all(bucket.query("entry-10"));
    expect(records.length).toEqual(3);

    expect(records[0]).toMatchObject({
      time: 1000n,
      size: 9n,
      contentType: "application/octet-stream",
      labels: {},
    });
    expect(await records[0].read()).toEqual(Buffer.from("somedata1", "ascii"));

    expect(records[1]).toMatchObject({
      time: 2000n,
      size: 9n,
      contentType: "text/plain",
      labels: {},
    });
    expect(await records[1].read()).toEqual(Buffer.from("somedata2", "ascii"));

    expect(records[2]).toMatchObject({
      time: 3000n,
      size: 9n,
      contentType: "application/octet-stream",
      labels: { label1: "value1", label2: "value2" },
    });
    expect(await records[2].read()).toEqual(Buffer.from("somedata3", "ascii"));
  });

  it_api("1.7")("should write a batch of records with errors", async () => {
    const bucket: Bucket = await client.getBucket("bucket");

    const batch = await bucket.beginWriteBatch("entry-1");
    batch.add(1000_000n, "somedata1");
    batch.add(2000n, "somedata2", "text/plain");
    batch.add(3000n, "somedata3", undefined, {
      label1: "value1",
      label2: "value2",
    });

    const errors = await batch.write();
    expect(errors.size).toEqual(1);
    expect(errors.get(1000_000n)).toEqual(
      new APIError("A record with timestamp 1000000 already exists", 409),
    );
  });

  it_api("1.11")("should update labels in a batch", async () => {
    const bucket: Bucket = await client.getBucket("bucket");

    const batch = await bucket.beginUpdateBatch("entry-1");
    batch.addOnlyLabels(1000_000n, { label1: "value1", label2: "" });
    batch.addOnlyLabels(20_000_000n, {});
    const errors = await batch.write();
    expect(errors.size).toEqual(1);
    expect(errors.get(20_000_000n)).toEqual(
      new APIError("No record with timestamp 20000000", 404),
    );
  });
});
