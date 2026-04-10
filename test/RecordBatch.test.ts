import { Headers } from "undici";
import { RecordBatch, RecordBatchType } from "../src/RecordBatch";
import { HttpClient } from "../src/http/HttpClient";

describe("RecordBatch", () => {
  it("should send multi-entry write batches in timestamp order", async () => {
    let requestBody = "";
    let requestHeaders: Record<string, string> | undefined;

    const mockHttpClient = {
      apiVersion: [1, 18],
      post: vi.fn().mockImplementation(async (_url, body, headers) => {
        requestBody = await new Response(body as BodyInit).text();
        requestHeaders = headers;
        return {
          status: 200,
          headers: new Headers(),
          data: "",
        };
      }),
    } as unknown as HttpClient;

    const batch = new RecordBatch(
      "bucket",
      mockHttpClient,
      RecordBatchType.WRITE,
    );
    batch.add("entry-first", 3_000n, "b", "text/plain");
    batch.add("entry-second", 1_000n, "a", "text/plain");

    await batch.send();

    expect(requestBody).toBe("ab");
    expect(requestHeaders).toMatchObject({
      "x-reduct-entries": "entry-second,entry-first",
      "x-reduct-start-ts": "1000",
      "x-reduct-0-0": "1,text/plain",
      "x-reduct-1-2000": "1,text/plain",
    });
  });
});
