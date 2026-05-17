import { Client } from "../src/Client";
import { cleanStorage, it_api, makeClient } from "./utils/Helpers";

describe("Lifecycle", () => {
  const client: Client = makeClient();

  const settings = {
    lifecycleType: "delete" as const,
    bucket: "test-bucket-1",
    entries: [],
    maxAge: "1h",
    interval: "10m",
    mode: "enabled" as const,
  };

  beforeEach(async () => {
    await cleanStorage(client);
    const lifecycles = await client.getLifecycleList();
    await Promise.all(
      lifecycles.map((lifecycle) => client.deleteLifecycle(lifecycle.name)),
    );
    await client.createBucket("test-bucket-1");
  }, 60000);

  it_api("1.20")("should get list of lifecycle policies", async () => {
    const lifecycles = await client.getLifecycleList();
    expect(lifecycles).toHaveLength(0);
  });

  it_api("1.20")("should create a lifecycle policy", async () => {
    await client.createLifecycle("test-lifecycle", settings);

    const lifecycles = await client.getLifecycleList();
    expect(lifecycles).toHaveLength(1);

    const lifecycle = await client.getLifecycle("test-lifecycle");
    expect(lifecycle.info).toMatchObject({
      name: "test-lifecycle",
      mode: "enabled",
      isRunning: true,
      isProvisioned: false,
    });

    expect(lifecycle.settings).toMatchObject(settings);
  });

  it_api("1.20")("should delete a lifecycle policy", async () => {
    await client.createLifecycle("test-lifecycle", settings);

    await client.deleteLifecycle("test-lifecycle");

    const lifecycles = await client.getLifecycleList();
    expect(lifecycles).toHaveLength(0);
  });

  it_api("1.20")("should update a lifecycle policy", async () => {
    await client.createLifecycle("test-lifecycle", settings);

    const newSettings = {
      lifecycleType: "delete" as const,
      bucket: "test-bucket-1",
      entries: ["entry-1", "entry-2"],
      maxAge: "2h",
      interval: "20m",
      when: { "&label": { $eq: "value" } },
      mode: "enabled" as const,
    };
    await client.updateLifecycle("test-lifecycle", newSettings);

    const lifecycle = await client.getLifecycle("test-lifecycle");
    expect(lifecycle.settings).toMatchObject(newSettings);
  });

  it_api("1.20")("should set lifecycle mode", async () => {
    await client.createLifecycle("test-lifecycle", settings);

    await client.setLifecycleMode("test-lifecycle", "dry_run");

    const lifecycle = await client.getLifecycle("test-lifecycle");
    expect(lifecycle.info.mode).toBe("dry_run");
    expect(lifecycle.settings.mode).toBe("dry_run");
    expect(lifecycle.settings).toMatchObject({
      bucket: settings.bucket,
      maxAge: settings.maxAge,
      interval: settings.interval,
    });
  });
});
