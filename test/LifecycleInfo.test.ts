import { describe, expect, it } from "vitest";
import { LifecycleInfo } from "../src/messages/LifecycleInfo";

describe("LifecycleInfo", () => {
  it("should parse lifecycle type and last run datetime", () => {
    const info = LifecycleInfo.parse({
      name: "test-lifecycle",
      mode: "dry_run",
      is_provisioned: true,
      is_running: false,
      type: "compress",
      last_run: "2026-06-15T07:02:25.123456Z",
    });

    expect(info).toMatchObject({
      name: "test-lifecycle",
      mode: "dry_run",
      type: "compress",
      isProvisioned: true,
      isRunning: false,
    });
    expect(info.lastRun).toBeInstanceOf(Date);
    expect(info.lastRun?.toISOString()).toBe("2026-06-15T07:02:25.123Z");
  });

  it("should default lifecycle type and last run when omitted", () => {
    const info = LifecycleInfo.parse({
      name: "test-lifecycle",
      mode: "enabled",
      is_provisioned: false,
      is_running: true,
      type: undefined,
      last_run: undefined,
    });

    expect(info.type).toBe("delete");
    expect(info.lastRun).toBeUndefined();
  });
});
