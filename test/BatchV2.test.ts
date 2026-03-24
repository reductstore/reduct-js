import { fetchAndParseBatchV2 } from "../src/batch/BatchV2";
import { HttpClient } from "../src/http/HttpClient";
import { ReadableRecord } from "../src/Record";
import { Headers } from "undici";

describe("BatchV2", () => {
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
        get: jest
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
        head: jest
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

    it("should handle 204 No Content response in continuous query", async () => {
      let callCount = 0;
      const mockHttpClient = {
        get: jest.fn().mockImplementation(() => {
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
