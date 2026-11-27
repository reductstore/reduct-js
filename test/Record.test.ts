import { Bucket } from "../src/Bucket";

describe("WritableRecord", () => {
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
      let requestHeaders: Record<string, string> = {};
      const httpClient = {
        post: async (
          _url: string,
          _data: unknown,
          headers: Record<string, string>,
        ) => {
          requestHeaders = headers;
          return { data: {}, headers: new Headers(), status: 200 };
        },
      };
      const bucket = new Bucket("bucket", httpClient as any);

      await (
        await bucket.beginWrite("entry", { ts: 1_000n, sync })
      ).write("data");

      expect(requestHeaders["x-reduct-sync-write"]).toBe(expected);
    },
  );
});
