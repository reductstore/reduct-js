import { Client } from "../src/Client";
import { cleanStorage, it_api, makeClient } from "./Helpers";
import { DiagnosticsItem } from "../src/messages/Diagnostics";

describe("Replication", () => {
  const client: Client = makeClient();

  const settings = {
    srcBucket: "test-bucket-1",
    dstBucket: "test-bucket-2",
    dstHost: "http://localhost:8383",
    dstToken: "***", // it is not possible to get token from the server
    entries: [],
    include: {},
    exclude: {},
  };

  beforeEach((done) => {
    cleanStorage(client)
      .then(() => client.getReplicationList())
      .then((replications) => {
        return Promise.all(
          replications.map((replication) => {
            return client.deleteReplication(replication.name);
          }),
        );
      })
      .then(() => client.createBucket("test-bucket-1"))
      .then(() => client.createBucket("test-bucket-2"))
      .then(() => done());
  });

  it_api("1.8")("should get list of replications", async () => {
    const replications = await client.getReplicationList();
    expect(replications).toHaveLength(0);
  });

  it_api("1.8")("should create a replication", async () => {
    await client.createReplication("test-replication", settings);

    const replications = await client.getReplicationList();
    expect(replications).toHaveLength(1);

    const replication = await client.getReplication("test-replication");
    expect(replication.info).toMatchObject({
      name: "test-replication",
      isActive: false,
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

  it_api("1.8")("should update a replication", async () => {
    await client.createReplication("test-replication", settings);

    const newSettings = {
      srcBucket: "test-bucket-1",
      dstBucket: "test-bucket-2",
      dstHost: "http://localhost:8383",
      dstToken: "***",
      entries: ["entry-1", "entry-2"],
      include: {
        label: "value",
      },
      exclude: {
        label: "value",
      },
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
    });

    const replication = await client.getReplication("test-replication");
    expect(replication.settings).toMatchObject({
      ...settings,
      eachN: 10n,
      eachS: 10,
    });
  });
});
