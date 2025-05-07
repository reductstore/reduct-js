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
  public readonly stream: ReadableStream<Uint8Array>;
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
    stream: ReadableStream<Uint8Array>,
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
    const reader = this.stream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: isDone } = await reader.read();
      done = isDone;
      if (value) {
        chunks.push(value);
      }
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return Buffer.from(out);
  }

  /**
   * Read content of record and convert to string
   */
  public async readAsString(): Promise<string> {
    return new TextDecoder().decode(await this.read());
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
   * @param data stream or buffer with data
   * @param size size of data in bytes (only for streams)
   */
  public async write(
    data:
      | Buffer
      | string
      | ReadableStream<Uint8Array>
      | { readable: boolean; read: () => any },
    size?: bigint | number,
  ): Promise<void> {
    let contentLength = BigInt(size ?? 0);
    let data_to_send = data;

    if (data instanceof ReadableStream<Uint8Array>) {
      if (size === undefined) {
        throw new Error("Size must be set for stream");
      }
    } else if (data instanceof Buffer || typeof data === "string") {
      contentLength = BigInt(data.length);
    } else if (data["readable"] !== undefined) {
      // a hack for Node.js streams
      const stream = data as { readable: boolean; read: () => any };
      if (stream.readable) {
        data_to_send = new ReadableStream<Uint8Array>({
          async pull(controller) {
            const chunk = stream.read();
            if (chunk) {
              controller.enqueue(chunk);
            } else {
              controller.close();
            }
          },
        });
      } else {
        throw new Error("Invalid stream");
      }
    } else {
      throw new Error("Invalid data type");
    }

    const { bucketName, entryName, options } = this;

    const headers: Record<string, string> = {
      "Content-Type": options.contentType ?? "application/octet-stream",
      "Content-Length": contentLength.toString(),
    };

    for (const [key, value] of Object.entries(options.labels ?? {})) {
      headers[`x-reduct-label-${key}`] = value.toString();
    }

    if (options.ts === undefined) {
      throw new Error("Timestamp must be set");
    }

    await this.httpClient.post(
      `/b/${bucketName}/${entryName}?ts=${options.ts}`,
      data_to_send,
      headers,
    );
  }
}
