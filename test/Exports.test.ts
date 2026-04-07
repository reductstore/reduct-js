import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

describe("Package exports", () => {
  test("should export ReplicationMode at runtime (CJS build)", () => {
    // `npm test` runs `npm run tsc` first, so `lib/` should exist here.
    // This guards against accidentally exporting ReplicationMode as a type-only symbol.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pkg = require("../lib/cjs/index.js");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(pkg.ReplicationMode).toMatchObject({
      ENABLED: "enabled",
      PAUSED: "paused",
      DISABLED: "disabled",
    });
  });

  test("should export ReplicationMode at runtime (ESM build)", async () => {
    const mod = await import(
      new URL("../lib/esm/index.js", import.meta.url).href
    );

    expect(mod.ReplicationMode).toMatchObject({
      ENABLED: "enabled",
      PAUSED: "paused",
      DISABLED: "disabled",
    });
  });
});
