import { Client } from "../src/Client";
import { cleanStorage, it_api, makeClient } from "./utils/Helpers";
import { DiagnosticsItem } from "../src/messages/Diagnostics";

describe("Replication", () => {
  const client: Client = makeClient();

  const settings = {
    srcBucket: "test-bucket-1",
    dstBucket: "test-bucket-2",
    dstHost: "http://localhost:8383",
    entries: [],
    include: {},
    exclude: {},
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

  it_api("1.10")("should support each_n and each_s", async () => {
    await client.createReplication("test-replication", {
      ...settings,
      eachN: 10n,
      eachS: 10,
      mode: "enabled" as const,
    });

    const replication = await client.getReplication("test-replication");
    expect(replication.settings).toMatchObject({
      ...settings,
      eachN: 10n,
      eachS: 10,
    });
  });

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
