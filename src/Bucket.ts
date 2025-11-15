// @ts-ignore`
import { BucketSettings } from "./messages/BucketSettings";
import { BucketInfo } from "./messages/BucketInfo";
import { EntryInfo } from "./messages/EntryInfo";
import { LabelMap, ReadableRecord, WritableRecord } from "./Record";
import { APIError } from "./APIError";
import { Batch, BatchType } from "./Batch";
import { QueryOptions, QueryType } from "./messages/QueryEntry";
import { HttpClient } from "./http/HttpClient";
import { QueryLinkOptions } from "./messages/QueryLink";

/**
 * Options for writing records
 */
export interface WriteOptions {
  ts?: bigint; // timestamp of the record
  labels?: LabelMap; // labels of the record
  contentType?: string; // content types of the record
}

/**
 * Represents a bucket in ReductStore
 */
export class Bucket {
  private name: string;
  private readonly httpClient: HttpClient;

  /**
   * Create a bucket. Use Client.creatBucket or Client.getBucket instead it
   * @constructor
   * @param name
   * @param httpClient
   * @see {Client}
   */
  constructor(name: string, httpClient: HttpClient) {
    this.name = name;
    this.httpClient = httpClient;

    this.readRecord = this.readRecord.bind(this);
  }

  /**
   * Get bucket settings
   * @async
   * @return {Promise<BucketSettings>}
   */
  async getSettings(): Promise<BucketSettings> {
    const { data } = await this.httpClient.get<any>(`/b/${this.name}`);
    return Promise.resolve(BucketSettings.parse(data.settings));
  }

  /**
   * Set bucket settings
   * @async
   * @param settings {BucketSettings} new settings (you can set a part of settings)
   */
  async setSettings(settings: BucketSettings): Promise<void> {
    await this.httpClient.put(
      `/b/${this.name}`,
      BucketSettings.serialize(settings),
    );
  }

  /**
   * Get information about a bucket
   * @async
   * @return {Promise<BucketInfo>}
   */
  async getInfo(): Promise<BucketInfo> {
    const { data } = await this.httpClient.get<any>(`/b/${this.name}`);
    return BucketInfo.parse(data.info);
  }

  /**
   * Get entry list
   * @async
   * @return {Promise<EntryInfo>}
   */
  async getEntryList(): Promise<EntryInfo[]> {
    const { data } = await this.httpClient.get<any>(`/b/${this.name}`);
    return Promise.resolve(
      data.entries.map((entry: any) => EntryInfo.parse(entry)),
    );
  }

  /**
   * Remove bucket
   * @async
   * @return {Promise<void>}
   */
  async remove(): Promise<void> {
    await this.httpClient.delete(`/b/${this.name}`);
  }

  /**
   * Remove an entry
   * @async
   * @param entry {string} name of the entry
   * @return {Promise<void>}
   */
  async removeEntry(entry: string): Promise<void> {
    await this.httpClient.delete(`/b/${this.name}/${entry}`);
  }

  /**
   * Remove a record
   * @param entry {string} name of the entry
   * @param ts {BigInt} timestamp of record in microseconds
   */
  async removeRecord(entry: string, ts: bigint): Promise<void> {
    await this.httpClient.delete(`/b/${this.name}/${entry}?ts=${ts}`);
  }

  /**
   * Remove a batch of records
   * @param entry {string} name of the entry
   * @param tsList {BigInt[]} list of timestamps of records in microseconds
   */
  async beginRemoveBatch(entry: string): Promise<Batch> {
    return new Batch(this.name, entry, this.httpClient, BatchType.REMOVE);
  }

  /**
   * Remove records by query
   * @param entry {string} name of the entry
   * @param start {BigInt} start point of the time period, if undefined, the query starts from the first record
   * @param stop  {BigInt} stop point of the time period. If undefined, the query stops at the last record
   * @param options {QueryOptions} options for query. You can use only include, exclude, eachS, eachN other options are ignored
   */
  async removeQuery(
    entry: string,
    start?: bigint,
    stop?: bigint,
    options?: QueryOptions,
  ): Promise<number> {
    options = options ?? {};
    const { data } = await this.httpClient.post<{ removed_records: number }>(
      `/b/${this.name}/${entry}/q`,
      QueryOptions.serialize(QueryType.REMOVE, options, start, stop),
    );
    return Promise.resolve(data["removed_records"]);
  }

  /**
   * Start writing a record into an entry
   * @param entry name of the entry
   * @param options {BigInt | WriteOptions} timestamp in microseconds for the record or options. It is current time if undefined.
   * @return Promise<WritableRecord>
   * @example
   * const record = await bucket.beginWrite("entry", {
   *  ts: 12345667n
   *  labels: {label1: "value1", label2: "value2"}
   *  contentType: "text/plain"
   * );
   * await record.write("Hello!");
   */
  async beginWrite(
    entry: string,
    options?: bigint | WriteOptions,
  ): Promise<WritableRecord> {
    let localOptions: WriteOptions = { ts: undefined };
    if (options !== undefined) {
      if (typeof options === "bigint") {
        localOptions = { ts: options };
      } else {
        localOptions = options as WriteOptions;
      }
    }
    localOptions.ts = localOptions.ts ?? BigInt(Date.now()) * 1000n;

    return Promise.resolve(
      new WritableRecord(this.name, entry, localOptions, this.httpClient),
    );
  }

  /**
   * Update labels of an existing record
   *
   * If a label has empty string value, it will be removed.
   *
   * @param entry {string} name of the entry
   * @param ts {BigInt} timestamp of record in microseconds
   * @param labels {LabelMap} labels to update
   */
  async update(entry: string, ts: bigint, labels: LabelMap): Promise<void> {
    const headers: Record<string, string> = {};

    for (const [key, value] of Object.entries(labels)) {
      headers[`x-reduct-label-${key}`] = value.toString();
    }

    await this.httpClient.patch(
      `/b/${this.name}/${entry}?ts=${ts}`,
      "",
      headers,
    );
  }

  /**
   * Start reading a record from an entry
   * @param entry name of the entry
   * @param ts {BigInt} timestamp of record in microseconds. Get the latest one, if undefined
   * @param head {boolean} return only head of the record
   * @return Promise<ReadableRecord>
   */
  async beginRead(
    entry: string,
    ts?: bigint,
    head?: boolean,
  ): Promise<ReadableRecord> {
    return await this.readRecord(
      entry,
      head ?? false,
      ts ? ts.toString() : undefined,
    );
  }

  /**
   * Rename an entry
   * @param entry entry name to rename
   * @param newEntry new entry name
   */
  async renameEntry(entry: string, newEntry: string): Promise<void> {
    await this.httpClient.put(
      `/b/${this.name}/${entry}/rename`,
      {
        new_name: newEntry,
      },
      {
        "Content-Type": "application/json",
      },
    );
  }

  /**
   * Rename a bucket
   * @param newName new name of the bucket
   */
  async rename(newName: string): Promise<void> {
    await this.httpClient.put(
      `/b/${this.name}/rename`,
      {
        new_name: newName,
      },
      {
        "Content-Type": "application/json",
      },
    );
    this.name = newName;
  }

  /**
   * Query records for a time interval as generator
   * @param entry entry name
   * @param entry {string} name of the entry
   * @param start {BigInt} start point of the time period
   * @param stop {BigInt} stop point of the time period
   * @param options {QueryOptions} options options for query
   * @example
   * for await (const record in bucket.query("entry-1", start, stop)) {
   *   console.log(record.ts, record.size);
   *   console.log(record.labels);
   *   const content = await record.read();
   *   // or use pipe
   *   const fileStream = fs.createWriteStream(`ts_${record.size}.txt`);
   *   record.pipe(fileStream);
   * }
   */
  async *query(
    entry: string,
    start?: bigint,
    stop?: bigint,
    options?: QueryOptions,
  ): AsyncGenerator<ReadableRecord> {
    let continuous = false;
    let pollInterval = 1;
    let head = false;

    const _options = options ?? {};
    const { data } = await this.httpClient.post<{ id: string }>(
      `/b/${this.name}/${entry}/q`,
      QueryOptions.serialize(QueryType.QUERY, _options, start, stop),
    );

    const { id } = data;
    continuous = _options.continuous ?? false;
    pollInterval = _options.pollInterval ?? 1;
    head = _options.head ?? false;

    yield* this.fetchAndParseBatchedRecords(
      entry,
      id,
      continuous,
      pollInterval,
      head,
    );
  }

  getName(): string {
    return this.name;
  }

  private async readRecord(
    entry: string,
    head: boolean,
    ts?: string,
    id?: string,
  ): Promise<ReadableRecord> {
    const params = new URLSearchParams();
    if (ts) params.set("ts", ts);
    if (id) params.set("q", id);

    const url = `/b/${this.name}/${entry}?${params.toString()}`;

    const response = head
      ? await this.httpClient.head(url)
      : await this.httpClient.get(url);

    if (response.status === 204) {
      throw new APIError(
        response.headers.get("x-reduct-error") ?? "No content",
        204,
      );
    }

    const { headers, data } = response;

    const labels: LabelMap = {};
    for (const [key, value] of headers.entries()) {
      if (key.startsWith("x-reduct-label-")) {
        labels[key.slice(15)] = value;
      }
    }

    const contentType =
      headers.get("content-type") ?? "application/octet-stream";
    const contentLength = BigInt(headers.get("content-length") ?? 0);
    const timestamp = BigInt(headers.get("x-reduct-time") ?? 0);
    const last = true;

    let stream: ReadableStream<Uint8Array>;

    if (head) {
      stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
          ctrl.close();
        },
      });
    } else if (data instanceof ReadableStream) {
      stream = data as ReadableStream<Uint8Array>;
    } else if (data instanceof Blob) {
      stream = data.stream() as ReadableStream<Uint8Array>;
    } else if (data instanceof Uint8Array) {
      stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
          ctrl.enqueue(data);
          ctrl.close();
        },
      });
    } else if (typeof data === "string") {
      const bytes = new TextEncoder().encode(data);
      stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
          ctrl.enqueue(bytes);
          ctrl.close();
        },
      });
    } else {
      throw new Error("Invalid body type returned by httpClient");
    }

    return new ReadableRecord(
      timestamp,
      contentLength,
      last,
      head,
      stream,
      labels,
      contentType,
    );
  }

  private async *fetchAndParseBatchedRecords(
    entry: string,
    id: string,
    continueQuery: boolean,
    poolInterval: number,
    head: boolean,
  ) {
    while (true) {
      try {
        for await (const record of this.readBatchedRecords(entry, head, id)) {
          yield record;

          if (record.last) {
            return;
          }
        }
      } catch (e) {
        if (e instanceof APIError && e.status === 204) {
          if (continueQuery) {
            await new Promise((resolve) =>
              setTimeout(resolve, poolInterval * 1000),
            );
            continue;
          }
          return;
        }
        throw e;
      }
    }
  }

  private async *readBatchedRecords(
    entry: string,
    head: boolean,
    id: string,
  ): AsyncGenerator<ReadableRecord> {
    const url = `/b/${this.name}/${entry}/batch?q=${id}`;
    const resp = head
      ? await this.httpClient.head(url)
      : await this.httpClient.get(url);

    if (resp.status === 204) {
      throw new APIError(
        resp.headers.get("x-reduct-error") ?? "No content",
        204,
      );
    }

    const { headers, data: body } = resp;

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    if (!head && body instanceof ReadableStream) {
      reader = body.getReader();
    }

    let leftover: Uint8Array | null = null;

    async function readExactly(len: number): Promise<Uint8Array> {
      if (!reader) throw new Error("Reader is not available");
      const parts: Uint8Array[] = [];
      let filled = 0;

      if (leftover) {
        const take = Math.min(leftover.length, len);
        parts.push(leftover.subarray(0, take));
        filled += take;
        leftover = leftover.length > take ? leftover.subarray(take) : null;
      }

      while (filled < len) {
        const { value, done } = await reader.read();
        if (done) throw new Error("Unexpected EOF while batching records");

        const need = len - filled;
        if (value.length > need) {
          parts.push(value.subarray(0, need));
          leftover = value.subarray(need);
          filled = len;
        } else {
          parts.push(value);
          filled += value.length;
        }
      }

      const out = new Uint8Array(len);
      let off = 0;
      for (const p of parts) {
        out.set(p, off);
        off += p.length;
      }
      return out;
    }

    const timeHeaders = [...headers.keys()].filter((k) =>
      k.startsWith("x-reduct-time-"),
    );
    const total = timeHeaders.length;
    let index = 0;

    for (const h of timeHeaders) {
      const tsStr = h.slice(14);
      const value = headers.get(h);
      if (!value)
        throw new APIError(`Invalid header ${h} with value ${value}`, 500);

      const { size, contentType, labels } = parseCsvRow(value);
      const byteLen = Number(size);

      index += 1;
      const isLastInBatch = index === total;
      const isLastInQuery =
        headers.get("x-reduct-last") === "true" && isLastInBatch;

      let bytes: Uint8Array;

      let stream: ReadableStream<Uint8Array>;
      if (!reader) {
        stream = new ReadableStream<Uint8Array>({
          start(ctrl) {
            ctrl.close();
          },
        });
      } else if (isLastInBatch) {
        // Last record in batch must be stramed
        // because it can be very large
        stream = new ReadableStream<Uint8Array>({
          start(ctrl) {
            if (leftover) {
              ctrl.enqueue(leftover);
            }
          },

          async pull(ctrl) {
            if (!reader) {
              throw new Error("Reader is not available");
            }

            const { value, done: isDone } = await reader.read();
            if (value) {
              ctrl.enqueue(value);
            }

            if (isDone) {
              ctrl.close();
            }
          },
        });
      } else {
        bytes = await readExactly(byteLen);
        stream = new ReadableStream<Uint8Array>({
          start(ctrl) {
            if (bytes.length) ctrl.enqueue(bytes);
            ctrl.close();
          },
        });
      }

      yield new ReadableRecord(
        BigInt(tsStr),
        BigInt(byteLen),
        isLastInQuery,
        head,
        stream,
        labels,
        contentType,
      );
    }
  }

  /**
   * Create a new batch for writing records to the database.
   * @param entry
   */
  async beginWriteBatch(entry: string): Promise<Batch> {
    return new Batch(this.name, entry, this.httpClient, BatchType.WRITE);
  }

  /**
   * Create a new batch for updating records in the database.
   * @param entry
   */
  async beginUpdateBatch(entry: string): Promise<Batch> {
    return new Batch(this.name, entry, this.httpClient, BatchType.UPDATE);
  }

  /**
   * Create a query link for downloading records
   * @param entry name of the entry
   * @param start start point of the time period for the query
   * @param stop stop point of the time period for the query
   * @param query options for the query
   * @param recordIndex index of the record to download (0 for the first record, 1 for the second, etc.)
   * @param expireAt expiration time of the link. Default is 24 hours from now
   * @param fileName name of the file to download. Default is `${entry}_${recordIndex}.bin`
   * @param baseUrl base url for link generation. If not set, the server's base url will be used
   */
  async createQueryLink(
    entry: string,
    start?: bigint,
    stop?: bigint,
    query?: QueryOptions,
    recordIndex?: number,
    expireAt?: Date,
    fileName?: string,
    baseUrl?: string,
  ): Promise<string> {
    const queryLinkOptions = {
      bucket: this.name,
      entry,
      query: query ?? {},
      index: recordIndex ?? 0,
      expireAt: expireAt ?? new Date(Date.now() + 24 * 3600 * 1000),
      baseUrl,
    } as QueryLinkOptions;

    const file = fileName ?? `${entry}_${recordIndex ?? 0}.bin`;
    const { data } = await this.httpClient.post<{ link: string }>(
      `/links/${file}`,
      QueryLinkOptions.serialize(queryLinkOptions, start, stop),
    );

    return data.link;
  }
}

function parseCsvRow(row: string): {
  size: bigint;
  contentType?: string;
  labels: LabelMap;
} {
  const items: string[] = [];
  let escaped = "";

  for (const item of row.split(",")) {
    if (item.startsWith('"') && !escaped) {
      escaped = item.substring(1);
    }

    if (escaped) {
      if (item.endsWith('"')) {
        escaped = escaped.slice(0, -1);
        items.push(escaped);
        escaped = "";
      } else {
        escaped += item;
      }
    } else {
      items.push(item);
    }
  }

  const size = BigInt(items[0]);
  // eslint-disable-next-line prefer-destructuring
  const contentType = items[1];
  const labels: LabelMap = {};

  for (const item of items.slice(2)) {
    if (!item.includes("=")) {
      continue;
    }

    const [key, value] = item.split("=", 2);
    labels[key] = value;
  }

  return {
    size,
    contentType,
    labels,
  };
}
