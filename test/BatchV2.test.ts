import { fetchAndParseBatchV2 } from "../src/batch/BatchV2";
import { HttpClient } from "../src/http/HttpClient";
import { ReadableRecord } from "../src/Record";
import { Headers } from "undici";

describe("BatchV2", () => {
  describe("fetchAndParseBatchV2", () => {
    it("should handle empty batch response", async () => {
      // Mock HttpClient
      const headers = new Headers();
      headers.set("x-reduct-entries", ""); // Empty entries header
      headers.set("x-reduct-start-ts", "0");

      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          headers: headers,
          data: new ReadableStream<Uint8Array>({
            start(controller) {
              controller.close();
            },
          }),
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

      expect(records.length).toBe(0);
      expect(mockHttpClient.get).toHaveBeenCalledWith("/io/test-bucket/read", {
        "x-reduct-query-id": "query-id-123",
      });
    });

    it("should handle empty batch response with HEAD request", async () => {
      // Mock HttpClient
      const headers = new Headers();
      headers.set("x-reduct-entries", ""); // Empty entries header
      headers.set("x-reduct-start-ts", "0");

      const mockHttpClient = {
        head: jest.fn().mockResolvedValue({
          status: 200,
          headers: headers,
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

      expect(records.length).toBe(0);
      expect(mockHttpClient.head).toHaveBeenCalledWith("/io/test-bucket/read", {
        "x-reduct-query-id": "query-id-123",
      });
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
          // Second call returns empty batch
          const headers200 = new Headers();
          headers200.set("x-reduct-entries", "");
          headers200.set("x-reduct-start-ts", "0");
          return Promise.resolve({
            status: 200,
            headers: headers200,
            data: new ReadableStream<Uint8Array>({
              start(controller) {
                controller.close();
              },
            }),
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

      expect(records.length).toBe(0);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
