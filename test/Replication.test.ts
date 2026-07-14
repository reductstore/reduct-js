import { Client } from "../src/Client";
import { ReplicationCompression } from "../src/messages/ReplicationCompression";
import { ReplicationSettings } from "../src/messages/ReplicationSettings";
import { cleanStorage, it_api, makeClient } from "./utils/Helpers";
import { DiagnosticsItem } from "../src/messages/Diagnostics";

describe("ReplicationSettings", () => {
  it("should default omitted compression to none", () => {
    const settings = ReplicationSettings.parse({
      src_bucket: "src",
      dst_bucket: "dst",
      dst_host: "http://localhost:8383",
      entries: [],
    });

    expect(settings.compression).toBe(ReplicationCompression.NONE);
    expect(ReplicationSettings.serialize(settings).compression).toBe(
      ReplicationCompression.NONE,
    );
  });

  it("should serialize replication compression", () => {
    const payload = ReplicationSettings.serialize({
      srcBucket: "src",
      dstBucket: "dst",
      dstHost: "http://localhost:8383",
      entries: [],
      compression: ReplicationCompression.ZSTD,
    });

    expect(payload.compression).toBe("zstd");
  });

  it("should parse replication compression", () => {
    const settings = ReplicationSettings.parse({
      src_bucket: "src",
      dst_bucket: "dst",
      dst_host: "http://localhost:8383",
      entries: [],
      compression: "gzip",
    });

    expect(settings.compression).toBe(ReplicationCompression.GZIP);
  });

  it("should reject unknown replication compression values", () => {
    expect(() =>
      ReplicationSettings.parse({
        src_bucket: "src",
        dst_bucket: "dst",
        dst_host: "http://localhost:8383",
        entries: [],
        compression: "brotli",
      }),
    ).toThrow("Unknown replication compression: brotli");
  });
});

describe("Replication", () => {
  const client: Client = makeClient();

  const settings = {
    srcBucket: "test-bucket-1",
    dstBucket: "test-bucket-2",
    dstHost: "http://localhost:8383",
    entries: [],
    mode: "enabled" as const,
  };

  beforeEach(async () => {
    await cleanStorage(client);
    const replications = await client.getReplicationList();
    await Promise.all(
      replications.map((replication) =>
        client.deleteReplication(replication.name),
      ),
    );
    await client.createBucket("test-bucket-1");
    await client.createBucket("test-bucket-2");
  });

  it_api("1.8")("should get list of replications", async () => {
    const replications = await client.getReplicationList();
    expect(replications).toHaveLength(0);
  });

  it_api("1.17")("should create a replication", async () => {
    await client.createReplication("test-replication", settings);

    const replications = await client.getReplicationList();
    expect(replications).toHaveLength(1);

    const replication = await client.getReplication("test-replication");
    expect(replication.info).toMatchObject({
      name: "test-replication",
      mode: "enabled",
      isActive: true,
      isProvisioned: false,
      pendingRecords: 0n,
    });

    expect(replication.settings).toMatchObject(settings);

    expect(replication.diagnostics).toMatchObject({
      hourly: new DiagnosticsItem(),
    });
  });

  it_api("1.8")("should delete a replication", async () => {
    await client.createReplication("test-replication", settings);

    await client.deleteReplication("test-replication");

    const replications = await client.getReplicationList();
    expect(replications).toHaveLength(0);
  });

  it_api("1.17")("should update a replication", async () => {
    await client.createReplication("test-replication", settings);

    const newSettings = {
      srcBucket: "test-bucket-1",
      dstBucket: "test-bucket-2",
      dstHost: "http://localhost:8383",
      entries: ["entry-1", "entry-2"],
      when: { "&label": { $eq: "value" } },
      mode: "enabled" as const,
    };
    await client.updateReplication("test-replication", newSettings);

    const replication = await client.getReplication("test-replication");
    expect(replication.settings).toMatchObject(newSettings);
  });

  it_api("1.21")(
    "should create and update a replication with prefix",
    async () => {
      await client.createReplication("test-replication-prefix", {
        ...settings,
        dstPrefix: "robot-1",
      });

      let replication = await client.getReplication("test-replication-prefix");
      expect(replication.settings.dstPrefix).toBe("robot-1");

      await client.updateReplication("test-replication-prefix", {
        ...settings,
        dstPrefix: "line-a",
      });

      replication = await client.getReplication("test-replication-prefix");
      expect(replication.settings.dstPrefix).toBe("line-a");
    },
  );

  it_api("1.21")(
    "should create and update a replication with compression",
    async () => {
      await client.createReplication("test-replication-compression", {
        ...settings,
        compression: ReplicationCompression.ZSTD,
      });

      let replication = await client.getReplication(
        "test-replication-compression",
      );
      expect(replication.settings.compression).toBe(
        ReplicationCompression.ZSTD,
      );

      await client.updateReplication("test-replication-compression", {
        ...settings,
        compression: ReplicationCompression.GZIP,
      });

      replication = await client.getReplication("test-replication-compression");
      expect(replication.settings.compression).toBe(
        ReplicationCompression.GZIP,
      );
    },
  );

  it_api("1.18")("should set replication mode", async () => {
    await client.createReplication("test-replication", settings);

    await client.setReplicationMode("test-replication", "paused");

    const replication = await client.getReplication("test-replication");
    expect(replication.info.mode).toBe("paused");
    expect(replication.settings.mode).toBe("paused");
    expect(replication.settings).toMatchObject({
      srcBucket: settings.srcBucket,
      dstBucket: settings.dstBucket,
      dstHost: settings.dstHost,
    });
  });
});
