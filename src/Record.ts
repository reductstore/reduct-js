import Stream, { Readable } from "stream";
import { Buffer } from "buffer";
import { WriteOptions } from "./Bucket";
import { HttpClient } from "./http/HttpClient";

export type LabelMap = Record<string, string | number | boolean | bigint>;

/**
 * Represents a record in an entry for reading
 */
export class ReadableRecord {
  public readonly time: bigint;
  public readonly size: bigint;
  public readonly last: boolean;
  public readonly stream: ReadableStream<Uint8Array> | Stream;
  public readonly labels: LabelMap = {};
  public readonly contentType: string | undefined;
  private readonly arrayBuffer: ArrayBuffer | undefined;

  /**
   * Constructor which should be call from Bucket
   * @internal
   */
  public constructor(
    time: bigint,
    size: bigint,
    last: boolean,
    head: boolean,
    stream: ReadableStream<Uint8Array> | Stream,
    labels: LabelMap,
    contentType?: string,
  ) {
    this.time = time;
    this.size = size;
    this.last = last;
    this.stream = stream;
    this.labels = labels;
    this.contentType = contentType;
  }

  /**
   * Read content of record
   */
  public async read(): Promise<Buffer> {
    if (typeof (this.stream as any)?.getReader === "function") {
      // Web ReadableStream
      const reader = (this.stream as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const result = await reader.read();
        ({ done } = result);
        if (result.value) chunks.push(result.value);
      }
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      return Buffer.from(merged.buffer, merged.byteOffset, merged.byteLength);
    } else {
      // Node.js Readable
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        (this.stream as Readable)
          .on("data", (chunk: Buffer) => chunks.push(chunk))
          .on("end", () => resolve(Buffer.concat(chunks)))
          .on("error", reject);
      });
    }
  }

  /**
   * Read content of record and convert to string
   */
  public async readAsString(): Promise<string> {
    return (await this.read()).toString();
  }
}

/**
 * Represents a record in an entry for writing
 */
export class WritableRecord {
  private readonly bucketName: string;
  private readonly entryName: string;
  private readonly httpClient: HttpClient;
  private readonly options: WriteOptions;

  /**
   * Constructor for stream
   * @internal
   */
  public constructor(
    bucketName: string,
    entryName: string,
    options: WriteOptions,
    httpClient: HttpClient,
  ) {
    this.bucketName = bucketName;
    this.entryName = entryName;
    this.httpClient = httpClient;
    this.options = options;
  }

  /**
   * Write data to record asynchronously
   * @param data stream of buffer with data
   * @param size size of data in bytes (only for streams)
   */
  public async write(
    data: Buffer | string | Stream,
    size?: bigint | number,
  ): Promise<void> {
    let contentLength = size || 0;
    if (!(data instanceof Stream)) {
      contentLength = data.length;
    }

    const { bucketName, entryName, options } = this;

    const headers: Record<string, string> = {
      "Content-Length": contentLength.toString(),
      "Content-Type": options.contentType ?? "application/octet-stream",
    };

    for (const [key, value] of Object.entries(options.labels ?? {})) {
      headers[`x-reduct-label-${key}`] = value.toString();
    }

    if (options.ts === undefined) {
      throw new Error("Timestamp must be set");
    }

    await this.httpClient.post(
      `/b/${bucketName}/${entryName}?ts=${options.ts}`,
      data,
      headers,
    );
  }
}
