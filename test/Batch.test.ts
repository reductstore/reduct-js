import { Bucket } from "../src/Bucket";
import { HttpClient } from "../src/http/HttpClient";
import { Headers } from "undici";

describe("Batch", () => {
  it.each([
    ["default", undefined, undefined],
    ["false", false, undefined],
    ["true", true, "true"],
  ])(
    "sets x-reduct-sync-write only for synchronous writes (%s)",
    async (
      _description,
      sync: boolean | undefined,
      expected: string | undefined,
    ) => {
      let requestHeaders: Record<string, string> | undefined;
      const httpClient = {
        post: vi.fn().mockImplementation(async (_url, _body, headers) => {
          requestHeaders = headers;
          return { status: 200, headers: new Headers(), data: "" };
        }),
      } as unknown as HttpClient;
      const bucket = new Bucket("bucket", httpClient);
      const batch = await bucket.beginWriteBatch("entry", { sync });
      batch.add(1_000n, "data");

      await batch.write();

      expect(requestHeaders?.["x-reduct-sync-write"]).toBe(expected);
    },
  );
});
