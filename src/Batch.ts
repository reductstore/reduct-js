// @ts-ignore
import { AxiosInstance } from "axios";
import { LabelMap } from "./Record";
import { APIError } from "./APIError";
import Stream from "stream";

/**
 * Represents a batch of records for writing
 */

export class Batch {
  private readonly bucketName: string;
  private readonly entryName: string;
  private readonly httpClient: AxiosInstance;

  private readonly records: Map<
    bigint,
    {
      data: Buffer;
      contentType: string;
      labels: LabelMap;
    }
  >;

  public constructor(
    bucketName: string,
    entryName: string,
    httpClient: AxiosInstance,
  ) {
    this.bucketName = bucketName;
    this.entryName = entryName;
    this.httpClient = httpClient;
    this.records = new Map();
  }

  /**
   * Add record to batch
   * @param ts timestamp of record as a UNIX timestamp in microseconds
   * @param data {Buffer | string} data to write
   * @param contentType default: application/octet-stream
   * @param labels default: {}
   */
  public add(
    ts: bigint,
    data: Buffer | string,
    contentType?: string,
    labels?: LabelMap,
  ): void {
    const _contentType = contentType ?? "application/octet-stream";
    const _labels = labels ?? {};
    const _data: Buffer = data instanceof Buffer ? data : Buffer.from(data);
    this.records.set(ts, {
      data: _data,
      contentType: _contentType,
      labels: _labels,
    });
  }

  /**
   * Write batch to entry
   */
  public async write(): Promise<Map<bigint, APIError>> {
    const headers: Record<string, string> = {};
    const chunks: Buffer[] = [];
    let contentLength = 0;
    for (const [ts, { data, contentType, labels }] of this.items()) {
      contentLength += data.length;
      chunks.push(data);
      const headerName = `x-reduct-time-${ts}`;
      let headerValue = `${data.length},${contentType}`;

      for (const [key, value] of Object.entries(labels)) {
        if (value.toString().includes(",")) {
          headerValue += `,${key}="${value}"`;
        } else {
          headerValue += `,${key}=${value}`;
        }
      }

      headers[headerName] = headerValue;
    }

    headers["Content-Length"] = contentLength.toString();
    headers["Content-Type"] = "application/octet-stream";

    const stream = Stream.Readable.from(chunks);
    const response = await this.httpClient.post(
      `/b/${this.bucketName}/${this.entryName}/batch`,
      stream,
      {
        headers: headers,
      },
    );

    const errors = new Map<bigint, APIError>();
    for (const [key, value] of Object.entries(
      response.headers as Record<string, string>,
    )) {
      if (key.startsWith("x-reduct-error-")) {
        const ts = BigInt(key.slice(15));
        const [code, message] = value.split(",", 2);
        errors.set(ts, new APIError(message, Number.parseInt(code)));
      }
    }

    return errors;
  }

  /**
   * Get records in batch sorted by timestamp
   */
  items(): IterableIterator<
    [bigint, { data: Buffer; contentType: string; labels: LabelMap }]
  > {
    return new Map([...this.records.entries()].sort()).entries();
  }
}
