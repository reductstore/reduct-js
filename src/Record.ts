import Stream from "stream";
import { Buffer } from "buffer";
// @ts-ignore`
import { AxiosInstance } from "axios";
import { WriteOptions } from "./Bucket";

export type LabelMap = Record<string, string | number | boolean | bigint>;

/**
 * Represents a record in an entry for reading
 */
export class ReadableRecord {
  public readonly time: bigint;
  public readonly size: bigint;
  public readonly last: boolean;
  public readonly stream: Stream;
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
    stream: Stream,
    labels: LabelMap,
    contentType?: string,
    arrayBuffer?: ArrayBuffer,
  ) {
    this.time = time;
    this.size = size;
    this.last = last;
    this.stream = stream;
    this.labels = labels;
    this.contentType = contentType;
    this.arrayBuffer = arrayBuffer;

    if (head) {
      (this.arrayBuffer as ArrayBuffer) = new ArrayBuffer(0);
    }
  }

  /**
   * Read content of record
   */
  public async read(): Promise<Buffer> {
    if (this.arrayBuffer !== undefined) {
      return new Promise((resolve, reject) => {
        try {
          resolve(Buffer.from(this.arrayBuffer as ArrayBuffer));
        } catch (error) {
          reject(error);
        }
      });
    }
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      (this.stream as Stream).on("data", (chunk: Buffer) => chunks.push(chunk));
      (this.stream as Stream).on("error", (err: Error) => reject(err));
      (this.stream as Stream).on("end", () => resolve(Buffer.concat(chunks)));
    });
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
  private readonly httpClient: AxiosInstance;
  private readonly options: WriteOptions;

  /**
   * Constructor for stream
   * @internal
   */
  public constructor(
    bucketName: string,
    entryName: string,
    options: WriteOptions,
    httpClient: AxiosInstance,
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
      "Content-Type": options.contentType ?? "application/octet-stream",
    };

    if (typeof window === "undefined") {
      headers["Content-Length"] = contentLength.toString();
    }

    for (const [key, value] of Object.entries(options.labels ?? {})) {
      headers[`x-reduct-label-${key}`] = value.toString();
    }

    if (options.ts === undefined) {
      throw new Error("Timestamp must be set");
    }

    await this.httpClient.post(
      `/b/${bucketName}/${entryName}?ts=${options.ts}`,
      data,
      {
        headers: headers,
      },
    );
  }
}
