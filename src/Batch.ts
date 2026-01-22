import { LabelMap } from "./Record";
import { APIError } from "./APIError";
import { HttpClient } from "./http/HttpClient";

/**
 * Represents a batch of records for writing
 */

export enum BatchType {
  WRITE,
  UPDATE,
  REMOVE,
}

export class Batch {
  private readonly bucketName: string;
  private readonly entryName: string;
  private readonly httpClient: HttpClient;
  private readonly type: BatchType;

  private readonly records: Map<
    bigint,
    {
      data: Buffer;
      contentType: string;
      labels: LabelMap;
    }
  >;

  private totalSize: bigint;
  private lastAccess: number;

  public constructor(
    bucketName: string,
    entryName: string,
    httpClient: HttpClient,
    type: BatchType,
  ) {
    this.bucketName = bucketName;
    this.entryName = entryName;
    this.httpClient = httpClient;
    this.records = new Map();
    this.type = type;
    this.totalSize = BigInt(0);
    this.lastAccess = 0;
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
    const _data: Buffer =
      data instanceof Buffer ? data : Buffer.from(data as string, "utf-8");

    this.totalSize += BigInt(_data.length);
    this.lastAccess = Date.now();

    this.records.set(ts, {
      data: _data,
      contentType: _contentType,
      labels: _labels,
    });
  }

  /**
   * Add only labels to batch
   * Use for updating labels
   * @param ts timestamp of record as a UNIX timestamp in microseconds
   * @param labels
   */
  public addOnlyLabels(ts: bigint, labels: LabelMap): void {
    this.records.set(ts, {
      data: Buffer.from(""),
      contentType: "",
      labels: labels,
    });
  }

  /**
   * Add only timestamp to batch
   * Use for removing records
   * @param ts timestamp of record as a UNIX timestamp in microseconds
   */
  public addOnlyTimestamp(ts: bigint): void {
    this.records.set(ts, {
      data: Buffer.from(""),
      contentType: "",
      labels: {},
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

      let headerValue = "0,";
      if (this.type == BatchType.WRITE) {
        headerValue = `${data.length},${contentType}`;
      }

      for (const [key, value] of Object.entries(labels)) {
        if (value.toString().includes(",")) {
          headerValue += `,${key}="${value}"`;
        } else {
          headerValue += `,${key}=${value}`;
        }
      }

      headers[headerName] = headerValue;
    }

    let response;
    switch (this.type) {
      case BatchType.WRITE: {
        const stream = new ReadableStream<Uint8Array>({
          start(ctrl) {
            for (const chunk of chunks) {
              ctrl.enqueue(chunk);
            }
            ctrl.close();
          },
        });

        headers["Content-Type"] = "application/octet-stream";
        headers["Content-Length"] = contentLength.toString();

        response = await this.httpClient.post(
          `/b/${this.bucketName}/${this.entryName}/batch`,
          stream,
          headers,
        );
        break;
      }
      case BatchType.UPDATE:
        response = await this.httpClient.patch(
          `/b/${this.bucketName}/${this.entryName}/batch`,
          "",
          headers,
        );
        break;
      case BatchType.REMOVE:
        response = await this.httpClient.delete(
          `/b/${this.bucketName}/${this.entryName}/batch`,
          headers,
        );
        break;
    }

    const errors = new Map<bigint, APIError>();
    for (const [key, value] of response.headers.entries()) {
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
    return new Map(
      [...this.records.entries()].sort((a, b) =>
        a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
      ),
    ).entries();
  }

  /**
   * Get total size of batch
   */
  public size(): bigint {
    return this.totalSize;
  }

  /**
   * Get last access time of batch
   */
  public lastAccessTime(): number {
    return this.lastAccess;
  }

  /**
   * Get number of records in batch
   */
  public recordCount(): number {
    return this.records.size;
  }

  /**
   * Clear batch
   */
  public clear(): void {
    this.records.clear();
    this.totalSize = BigInt(0);
    this.lastAccess = 0;
  }
}
