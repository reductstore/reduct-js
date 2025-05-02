// @ts-ignore`
import { AxiosInstance } from "axios";
import { BucketSettings } from "./messages/BucketSettings";
import { BucketInfo } from "./messages/BucketInfo";
import { EntryInfo } from "./messages/EntryInfo";
import { LabelMap, ReadableRecord, WritableRecord } from "./Record";
import { APIError } from "./APIError";
import Stream, { Readable } from "stream";
import { Buffer } from "buffer";
import { Batch, BatchType } from "./Batch";
import { isCompatibale } from "./Client";
import { QueryOptions, QueryType } from "./messages/QueryEntry";

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
  private readonly httpClient: AxiosInstance;
  private readonly isBrowser: boolean;

  /**
   * Create a bucket. Use Client.creatBucket or Client.getBucket instead it
   * @constructor
   * @param name
   * @param httpClient
   * @see {Client}
   */
  constructor(name: string, httpClient: AxiosInstance) {
    this.name = name;
    this.httpClient = httpClient;
    this.isBrowser = typeof window !== "undefined";
    this.readRecord = this.readRecord.bind(this);
  }

  /**
   * Get bucket settings
   * @async
   * @return {Promise<BucketSettings>}
   */
  async getSettings(): Promise<BucketSettings> {
    const { data } = await this.httpClient.get(`/b/${this.name}`);
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
    const { data } = await this.httpClient.get(`/b/${this.name}`);
    return BucketInfo.parse(data.info);
  }

  /**
   * Get entry list
   * @async
   * @return {Promise<EntryInfo>}
   */
  async getEntryList(): Promise<EntryInfo[]> {
    const { data } = await this.httpClient.get(`/b/${this.name}`);
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
  ): Promise<void> {
    if (options !== undefined && options.when !== undefined) {
      const { data } = await this.httpClient.post(
        `/b/${this.name}/${entry}/q`,
        QueryOptions.serialize(QueryType.REMOVE, options),
      );
      return Promise.resolve(data["removed_records"]);
    } else {
      const ret = this.parse_query_params(start, stop, options);

      const { data } = await this.httpClient.delete(
        `/b/${this.name}/${entry}/q?${ret.query}`,
      );
      return Promise.resolve(data["removed_records"]);
    }
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

    await this.httpClient.patch(`/b/${this.name}/${entry}?ts=${ts}`, "", {
      headers,
    });
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
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
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
   * @param options {number | QueryOptions}  if number it is TTL of query on the server side, otherwise it is options for query
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
    options?: number | QueryOptions,
  ): AsyncGenerator<ReadableRecord> {
    let id;
    let header_api_version;
    let continuous = false;
    let pollInterval = 1;
    let head = false;
    if (
      options !== undefined &&
      typeof options === "object" &&
      ("when" in options || "ext" in options)
    ) {
      const { data, headers } = await this.httpClient.post(
        `/b/${this.name}/${entry}/q`,
        QueryOptions.serialize(QueryType.QUERY, options, start, stop),
      );
      ({ id } = data);
      header_api_version = headers["x-reduct-api"];
      continuous = options.continuous ?? false;
      pollInterval = options.pollInterval ?? 1;
      head = options.head ?? false;
    } else {
      // TODO: remove this block after 1.xx
      const ret = this.parse_query_params(start, stop, options);

      const url = `/b/${this.name}/${entry}/q?` + ret.query;
      const { data, headers } = await this.httpClient.get(url);
      ({ id } = data);
      header_api_version = headers["x-reduct-api"];
      ({ continuous, pollInterval, head } = ret);
    }

    if (isCompatibale("1.5", header_api_version) && !this.isBrowser) {
      yield* this.fetchAndParseBatchedRecords(
        entry,
        id,
        continuous,
        pollInterval,
        head,
      );
    } else {
      yield* this.fetchAndParseSingleRecord(
        entry,
        id,
        continuous,
        pollInterval,
        head,
      );
    }
  }

  getName(): string {
    return this.name;
  }

  private parse_query_params(
    start?: bigint,
    stop?: bigint,
    options?: QueryOptions | number,
  ) {
    let continueQuery = false;
    let poolInterval = 1;
    const params: string[] = [];
    let head = false;

    if (start !== undefined) {
      params.push(`start=${start}`);
    }

    if (stop !== undefined) {
      params.push(`stop=${stop}`);
    }

    if (options !== undefined) {
      if (typeof options === "number") {
        params.push(`ttl=${options}`);
      } else {
        // Build query string from options
        if (options.ttl !== undefined) {
          params.push(`ttl=${options.ttl}`);
        }

        for (const [key, value] of Object.entries(
          options.include ? options.include : {},
        )) {
          params.push(`include-${key}=${value}`);
        }

        for (const [key, value] of Object.entries(
          options.exclude ? options.exclude : {},
        )) {
          params.push(`exclude-${key}=${value}`);
        }

        if (options.eachS !== undefined) {
          params.push(`each_s=${options.eachS}`);
        }

        if (options.eachN !== undefined) {
          params.push(`each_n=${options.eachN}`);
        }

        if (options.limit !== undefined) {
          params.push(`limit=${options.limit}`);
        }

        if (options.continuous !== undefined) {
          params.push(`continuous=${options.continuous ? "true" : "false"}`);
          continueQuery = options.continuous;

          if (options.pollInterval !== undefined) {
            // eslint-disable-next-line prefer-destructuring
            poolInterval = options.pollInterval;
          }

          // Set default TTL for continue query as 2 * poolInterval
          if (options.ttl === undefined) {
            params.push(`ttl=${poolInterval * 2}`);
          }
        }
        continueQuery = options.continuous ?? false;
        poolInterval = options.pollInterval ?? 1;
        head = options.head ?? false;
      }
    }

    return {
      continuous: continueQuery,
      pollInterval: poolInterval,
      head: head,
      query: params.join("&"),
    };
  }

  private async *fetchAndParseSingleRecord(
    entry: string,
    id: string,
    continueQuery: boolean,
    pollInterval: number,
    head: boolean,
  ) {
    while (true) {
      try {
        const record = await this.readRecord(entry, head, undefined, id);
        yield record;
      } catch (e) {
        if (e instanceof APIError && e.status === 204) {
          if (continueQuery) {
            await new Promise((resolve) =>
              setTimeout(resolve, pollInterval * 1000),
            );
            continue;
          }
          return;
        }
        throw e;
      }
    }
  }

  private async readRecord(
    entry: string,
    head: boolean,
    ts?: string,
    id?: string,
  ): Promise<ReadableRecord> {
    let param = "";
    if (ts !== undefined) {
      param = `ts=${ts}`;
    }
    if (id !== undefined) {
      param = `q=${id}`;
    }

    const request = head ? this.httpClient.head : this.httpClient.get;
    const { status, headers, data } = await request(
      `/b/${this.name}/${entry}?${param}`,
      head
        ? undefined
        : {
            responseType: this.isBrowser ? "arraybuffer" : "stream",
          },
    );

    if (status === 204) {
      throw new APIError(headers["x-reduct-error"] ?? "No content", 204);
    }

    const labels: LabelMap = {};
    for (const [key, value] of Object.entries(
      headers as Record<string, string>,
    )) {
      if (key.startsWith("x-reduct-label-")) {
        labels[key.substring(15)] = value;
      }
    }

    if (this.isBrowser) {
      // Pass a dummy Stream object and use ArrayBuffer
      const arrayBuffer = data as ArrayBuffer;
      return new ReadableRecord(
        BigInt(headers["x-reduct-time"] ?? 0),
        BigInt(headers["content-length"] ?? 0),
        headers["x-reduct-last"] == "1",
        head,
        new Stream.Readable(),
        labels,
        headers["content-type"] ?? "application/octet-stream",
        arrayBuffer,
      );
    } else {
      // Pass the actual Stream object to ReadableRecord
      const stream = data as Readable;
      return new ReadableRecord(
        BigInt(headers["x-reduct-time"] ?? 0),
        BigInt(headers["content-length"] ?? 0),
        headers["x-reduct-last"] == "1",
        head,
        stream,
        labels,
        headers["content-type"] ?? "application/octet-stream",
      );
    }
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
    const request = head ? this.httpClient.head : this.httpClient.get;
    const { status, headers, data } = await request(
      `/b/${this.name}/${entry}/batch?q=${id}`,
      head ? undefined : { responseType: "stream" },
    );

    if (status === 204) {
      throw new APIError(headers["x-reduct-error"] ?? "No content", 204);
    }

    let count = 0;
    const total = Object.entries(headers).reduce(
      (acc, [key, _]) => (key.startsWith("x-reduct-time-") ? acc + 1 : acc),
      0,
    );
    let last = false;
    for (const [key, value] of Object.entries(
      headers as Record<string, string>,
    )) {
      if (!key.startsWith("x-reduct-time-")) continue;

      const ts = key.substring(14);
      const { size, contentType, labels } = parseCsvRow(value);

      count += 1;
      let stream;
      if (count === total) {
        if (headers["x-reduct-last"] === "true") {
          last = true;
        }
        stream = data;
      } else {
        let buffer = Buffer.from([]);
        if (!head) {
          buffer = await new Promise((resolve, reject) => {
            const err_handler = (err: any) => {
              reject(err);
            };
            data.on("readable", function handler() {
              const chunk = data.read(Number(size));
              if (chunk !== null) {
                resolve(chunk);
                data.off("readable", handler);
                data.off("error", err_handler);
              }
            });

            data.on("error", err_handler);
          });
        }
        stream = Readable.from(buffer);
      }

      yield new ReadableRecord(
        BigInt(ts),
        size,
        last,
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
