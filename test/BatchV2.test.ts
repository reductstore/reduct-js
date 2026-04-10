import { fetchAndParseBatchV2 } from "../src/batch/BatchV2";
import { HttpClient } from "../src/http/HttpClient";
import { ReadableRecord } from "../src/Record";
import { RecordBatch, RecordBatchType } from "../src/RecordBatch";
import { Headers } from "undici";

describe("BatchV2", () => {
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

  describe("fetchAndParseBatchV2", () => {
    const buildEmptyBatchHeaders = () => {
      const headers = new Headers();
      headers.set("x-reduct-entries", "");
      headers.set("x-reduct-start-ts", "0");
      return headers;
    };

    const buildSingleRecordBatchHeaders = () => {
      const headers = new Headers();
      headers.set("x-reduct-entries", "test-entry");
      headers.set("x-reduct-start-ts", "1000");
      headers.set("x-reduct-0-0", "4,text/plain,");
      headers.set("x-reduct-last", "true");
      return headers;
    };

    const buildDataStream = (value: string) =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(value));
          controller.close();
        },
      });

    it("should handle empty batch response", async () => {
      const emptyBatchHeaders = buildEmptyBatchHeaders();
      const batchWithDataHeaders = buildSingleRecordBatchHeaders();

      const mockHttpClient = {
        get: vi
          .fn()
          .mockResolvedValueOnce({
            status: 200,
            headers: emptyBatchHeaders,
            data: buildDataStream(""),
          })
          .mockResolvedValueOnce({
            status: 200,
            headers: batchWithDataHeaders,
            data: buildDataStream("test"),
          }),
      } as unknown as HttpClient;

      const records: ReadableRecord[] = [];
      for await (const record of fetchAndParseBatchV2(
        "test-bucket",
        "test-entry",
        "query-id-123",
        false, // continueQuery
        1, // poolInterval
        false, // head
        mockHttpClient,
      )) {
        records.push(record);
      }

      expect(records.length).toBe(1);
      expect(records[0].entry).toBe("test-entry");
      expect(records[0].last).toBe(true);
      await expect(records[0].readAsString()).resolves.toBe("test");
      expect(mockHttpClient.get).toHaveBeenCalledWith("/io/test-bucket/read", {
        "x-reduct-query-id": "query-id-123",
      });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it("should handle empty batch response with HEAD request", async () => {
      const emptyBatchHeaders = buildEmptyBatchHeaders();
      const batchWithDataHeaders = buildSingleRecordBatchHeaders();

      const mockHttpClient = {
        head: vi
          .fn()
          .mockResolvedValueOnce({
            status: 200,
            headers: emptyBatchHeaders,
            data: undefined,
          })
          .mockResolvedValueOnce({
            status: 200,
            headers: batchWithDataHeaders,
            data: undefined,
          }),
      } as unknown as HttpClient;

      const records: ReadableRecord[] = [];
      for await (const record of fetchAndParseBatchV2(
        "test-bucket",
        "test-entry",
        "query-id-123",
        false, // continueQuery
        1, // poolInterval
        true, // head
        mockHttpClient,
      )) {
        records.push(record);
      }

      expect(records.length).toBe(1);
      expect(records[0].entry).toBe("test-entry");
      expect(records[0].last).toBe(true);
      expect(mockHttpClient.head).toHaveBeenCalledWith("/io/test-bucket/read", {
        "x-reduct-query-id": "query-id-123",
      });
      expect(mockHttpClient.head).toHaveBeenCalledTimes(2);
    });

    it("should parse multi-entry batch records in timestamp order", async () => {
      const headers = new Headers();
      headers.set("x-reduct-entries", "entry-first,entry-second");
      headers.set("x-reduct-start-ts", "1000");
      headers.set("x-reduct-0-2000", "1,text/plain,");
      headers.set("x-reduct-1-0", "1,text/plain,");
      headers.set("x-reduct-last", "true");

      const mockHttpClient = {
        get: vi.fn().mockResolvedValue({
          status: 200,
          headers,
          data: buildDataStream("ab"),
        }),
      } as unknown as HttpClient;

      const records: ReadableRecord[] = [];
      for await (const record of fetchAndParseBatchV2(
        "test-bucket",
        "entry-first",
        "query-id-123",
        false,
        1,
        false,
        mockHttpClient,
      )) {
        records.push(record);
      }

      expect(records).toHaveLength(2);
      expect(records.map((record) => [record.entry, record.time])).toEqual([
        ["entry-second", 1000n],
        ["entry-first", 3000n],
      ]);
      await expect(records[0].readAsString()).resolves.toBe("a");
      await expect(records[1].readAsString()).resolves.toBe("b");
    });

    it("should handle 204 No Content response in continuous query", async () => {
      let callCount = 0;
      const mockHttpClient = {
        get: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call returns 204
            const headers204 = new Headers();
            headers204.set("x-reduct-error", "No content");
            return Promise.resolve({
              status: 204,
              headers: headers204,
              data: undefined,
            });
          }
          if (callCount === 2) {
            return Promise.resolve({
              status: 200,
              headers: buildEmptyBatchHeaders(),
              data: buildDataStream(""),
            });
          }

          return Promise.resolve({
            status: 200,
            headers: buildSingleRecordBatchHeaders(),
            data: buildDataStream("test"),
          });
        }),
      } as unknown as HttpClient;

      const records: ReadableRecord[] = [];
      for await (const record of fetchAndParseBatchV2(
        "test-bucket",
        "test-entry",
        "query-id-123",
        true, // continueQuery - important!
        0.01, // poolInterval (10ms for fast test)
        false, // head
        mockHttpClient,
      )) {
        records.push(record);
      }

      expect(records.length).toBe(1);
      expect(records[0].entry).toBe("test-entry");
      expect(records[0].last).toBe(true);
      await expect(records[0].readAsString()).resolves.toBe("test");
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });
  });
});
