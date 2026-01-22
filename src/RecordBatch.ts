import { Buffer } from "buffer";
import { APIError } from "./APIError";
import { HttpClient } from "./http/HttpClient";
import { LabelMap } from "./Record";

const HEADER_PREFIX = "x-reduct-";
const ERROR_HEADER_PREFIX = "x-reduct-error-";
const ENTRIES_HEADER = "x-reduct-entries";
const START_TS_HEADER = "x-reduct-start-ts";
const LABELS_HEADER = "x-reduct-labels";

type RecordBatchItem = {
  entry: string;
  timestamp: bigint;
  data: Buffer;
  contentType: string;
  labels: LabelMap;
};

type RecordBatchMeta = {
  contentType: string;
  labels: Record<string, string>;
};

/**
 * Batch of records to write them in one request (batch protocol v2).
 */
export class RecordBatch {
  private readonly bucketName: string;
  private readonly httpClient: HttpClient;
  private readonly records: Map<string, RecordBatchItem>;
  private totalSize: bigint;
  private lastAccess: number;

  public constructor(bucketName: string, httpClient: HttpClient) {
    this.bucketName = bucketName;
    this.httpClient = httpClient;
    this.records = new Map();
    this.totalSize = 0n;
    this.lastAccess = 0;
  }

  /**
   * Add record to batch with entry name.
   * @param entry name of entry
   * @param ts timestamp of record as a UNIX timestamp in microseconds
   * @param data {Buffer | string} data to write
   * @param contentType default: application/octet-stream
   * @param labels default: {}
   */
  public add(
    entry: string,
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

    const key = `${entry}\u0000${ts.toString()}`;
    this.records.set(key, {
      entry,
      timestamp: ts,
      data: _data,
      contentType: _contentType,
      labels: _labels,
    });
  }

  /**
   * Write batch of records to bucket (Multi-entry API).
   */
  public async write(): Promise<Map<string, Map<bigint, APIError>>> {
    if (this.httpClient.apiVersion && this.httpClient.apiVersion["1"] < 18) {
      throw new Error(
        "Multi-entry batch API is not supported by the server. Requires API version >= 1.18.",
      );
    }

    const { contentLength, headers } = makeHeadersV2(this);
    const chunks: Buffer[] = [];
    for (const [, record] of this.items()) {
      chunks.push(record.data);
    }

    const stream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        for (const chunk of chunks) {
          ctrl.enqueue(chunk);
        }
        ctrl.close();
      },
    });

    headers["Content-Length"] = contentLength.toString();

    const response = await this.httpClient.post(
      `/io/${this.bucketName}/write`,
      stream,
      headers,
    );

    return parseErrorsFromHeadersV2(response.headers);
  }

  /**
   * Get records in batch sorted by entry name and timestamp.
   */
  public items(): Array<[[string, bigint], RecordBatchItem]> {
    const items: Array<[[string, bigint], RecordBatchItem]> = [
      ...this.records.values(),
    ].map((record): [[string, bigint], RecordBatchItem] => [
      [record.entry, record.timestamp],
      record,
    ]);

    items.sort((a, b) => {
      const [[entryA, tsA]] = a;
      const [[entryB, tsB]] = b;
      if (entryA !== entryB) {
        return entryA < entryB ? -1 : 1;
      }
      return tsA < tsB ? -1 : tsA > tsB ? 1 : 0;
    });

    return items;
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
    this.totalSize = 0n;
    this.lastAccess = 0;
  }
}

type PreparedRecords = {
  entries: string[];
  startTs: bigint;
  indexedRecords: Array<[number, bigint, RecordBatchItem]>;
};

function makeHeadersV2(batch: RecordBatch): {
  contentLength: bigint;
  headers: Record<string, string>;
} {
  const recordHeaders: Record<string, string> = {};
  let contentLength = 0n;
  const records = batch.items();

  if (records.length === 0) {
    recordHeaders[ENTRIES_HEADER] = "";
    recordHeaders[START_TS_HEADER] = "0";
    recordHeaders["Content-Type"] = "application/octet-stream";
    return { contentLength, headers: recordHeaders };
  }

  const { entries, startTs, indexedRecords } = prepareRecordsV2(records);
  const labelIndex = new Map<string, number>();
  const labelNames: string[] = [];
  const lastMeta = new Map<number, RecordBatchMeta>();

  recordHeaders[ENTRIES_HEADER] = entries
    .map((entry) => encodeHeaderComponent(entry))
    .join(",");
  recordHeaders[START_TS_HEADER] = startTs.toString();

  for (const [entryIndex, timestamp, record] of indexedRecords) {
    contentLength += BigInt(record.data.length);
    const delta = timestamp - startTs;
    const contentType = record.contentType || "application/octet-stream";
    const previous = lastMeta.get(entryIndex);

    const currentLabels = normalizeLabels(record.labels);
    const labelDelta = buildLabelDelta(
      currentLabels,
      previous?.labels,
      labelIndex,
      labelNames,
    );
    const hasLabels = labelDelta.length > 0;
    const contentTypePart =
      previous && previous.contentType === contentType ? "" : contentType;

    const headerParts: string[] = [record.data.length.toString()];
    if (contentTypePart || hasLabels) {
      headerParts.push(contentTypePart);
    }
    if (hasLabels) {
      headerParts.push(labelDelta);
    }

    recordHeaders[`${HEADER_PREFIX}${entryIndex}-${delta.toString()}`] =
      headerParts.join(",");
    lastMeta.set(entryIndex, { contentType, labels: currentLabels });
  }

  if (labelNames.length > 0) {
    recordHeaders[LABELS_HEADER] = labelNames
      .map((name) => encodeHeaderComponent(name))
      .join(",");
  }

  recordHeaders["Content-Type"] = "application/octet-stream";
  return { contentLength, headers: recordHeaders };
}

function prepareRecordsV2(
  records: Array<[[string, bigint], RecordBatchItem]>,
): PreparedRecords {
  const entries: string[] = [];
  const entryIndexLookup = new Map<string, number>();
  const indexedRecords: Array<[number, bigint, RecordBatchItem]> = [];

  const [firstMeta] = records[0] ?? [];
  let startTs = firstMeta ? firstMeta[1] : 0n;
  for (const [[, timestamp]] of records) {
    if (timestamp < startTs) {
      startTs = timestamp;
    }
  }

  for (const [, record] of records) {
    const recordEntry = record.entry;
    if (!recordEntry) {
      throw new Error("Entry name is required for batch protocol v2");
    }

    let entryIndex = entryIndexLookup.get(recordEntry);
    if (entryIndex === undefined) {
      entryIndex = entries.length;
      entries.push(recordEntry);
      entryIndexLookup.set(recordEntry, entryIndex);
    }
    indexedRecords.push([entryIndex, record.timestamp, record]);
  }

  indexedRecords.sort((a, b) => {
    if (a[0] !== b[0]) {
      return a[0] - b[0];
    }
    return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
  });

  return { entries, startTs, indexedRecords };
}

function buildLabelDelta(
  labels: Record<string, string>,
  previousLabels: Record<string, string> | undefined,
  labelIndex: Map<string, number>,
  labelNames: string[],
): string {
  const ops: Array<[number, string]> = [];

  const ensureLabel = (name: string): number => {
    const existing = labelIndex.get(name);
    if (existing !== undefined) {
      return existing;
    }
    const idx = labelNames.length;
    labelIndex.set(name, idx);
    labelNames.push(name);
    return idx;
  };

  if (!previousLabels) {
    const keys = Object.keys(labels).sort();
    for (const key of keys) {
      const idx = ensureLabel(key);
      ops.push([idx, formatLabelValue(labels[key])]);
    }
  } else {
    const keys = new Set(Object.keys(previousLabels));
    for (const key of Object.keys(labels)) {
      keys.add(key);
    }
    const sorted = [...keys].sort();
    for (const key of sorted) {
      const prev = previousLabels[key];
      const curr = labels[key];
      if (prev === curr) {
        continue;
      }
      const idx = ensureLabel(key);
      if (curr === undefined) {
        ops.push([idx, ""]);
      } else {
        ops.push([idx, formatLabelValue(curr)]);
      }
    }
  }

  ops.sort((a, b) => a[0] - b[0]);
  return ops.map(([idx, value]) => `${idx}=${value}`).join(",");
}

function normalizeLabels(labels: LabelMap): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(labels)) {
    normalized[key] = value.toString();
  }
  return normalized;
}

function formatLabelValue(value: string): string {
  if (value.includes(",")) {
    return `"${value}"`;
  }
  return value;
}

function isTchar(byte: number): boolean {
  return (
    (byte >= 48 && byte <= 57) ||
    (byte >= 65 && byte <= 90) ||
    (byte >= 97 && byte <= 122) ||
    byte === 33 ||
    byte === 35 ||
    byte === 36 ||
    byte === 37 ||
    byte === 38 ||
    byte === 39 ||
    byte === 42 ||
    byte === 43 ||
    byte === 45 ||
    byte === 46 ||
    byte === 94 ||
    byte === 95 ||
    byte === 96 ||
    byte === 124 ||
    byte === 126
  );
}

function encodeHeaderComponent(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let encoded = "";
  for (const byte of bytes) {
    if (isTchar(byte)) {
      encoded += String.fromCharCode(byte);
    } else {
      encoded += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
    }
  }
  return encoded;
}

function decodeHeaderComponent(encoded: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i += 1) {
    const ch = encoded[i];
    if (ch === "%") {
      if (i + 2 >= encoded.length) {
        throw new Error(`Invalid encoding in header value: '${encoded}'`);
      }
      const hex = encoded.slice(i + 1, i + 3);
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) {
        throw new Error(`Invalid encoding in header value: '${encoded}'`);
      }
      bytes.push(Number.parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(ch.charCodeAt(0));
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

function parseHeaderList(header: string): string[] {
  const trimmed = header.trim();
  if (!trimmed) {
    throw new Error("x-reduct-entries header is required");
  }
  return trimmed.split(",").map((item) => decodeHeaderComponent(item.trim()));
}

function parseErrorsFromHeadersV2(
  headers: Headers,
): Map<string, Map<bigint, APIError>> {
  const entriesHeader = headers.get(ENTRIES_HEADER);
  if (!entriesHeader) {
    throw new Error("x-reduct-entries header is required");
  }
  const entries = parseHeaderList(entriesHeader);

  const startTsHeader = headers.get(START_TS_HEADER);
  if (!startTsHeader) {
    throw new Error("x-reduct-start-ts header is required");
  }
  let startTs: bigint;
  try {
    startTs = BigInt(startTsHeader);
  } catch {
    throw new Error("Invalid batched header");
  }

  const errors = new Map<string, Map<bigint, APIError>>();
  for (const [rawName, value] of headers.entries()) {
    const name = rawName.toLowerCase();
    if (!name.startsWith(ERROR_HEADER_PREFIX)) {
      continue;
    }

    const suffix = name.slice(ERROR_HEADER_PREFIX.length);
    const lastDash = suffix.lastIndexOf("-");
    if (lastDash === -1) {
      throw new Error(`Invalid error header '${rawName}'`);
    }

    const entryIndexRaw = suffix.slice(0, lastDash);
    const deltaRaw = suffix.slice(lastDash + 1);
    if (!/^\d+$/.test(entryIndexRaw) || !/^\d+$/.test(deltaRaw)) {
      throw new Error(`Invalid error header '${rawName}'`);
    }

    const entryIndex = Number(entryIndexRaw);
    const entryName = entries[entryIndex];
    if (!entryName) {
      throw new Error(`Invalid error header '${rawName}'`);
    }

    const delta = BigInt(deltaRaw);
    const [code, message] = value.split(",", 2);
    const entryErrors = errors.get(entryName) ?? new Map<bigint, APIError>();
    entryErrors.set(
      startTs + delta,
      new APIError(message, Number.parseInt(code)),
    );
    errors.set(entryName, entryErrors);
  }

  return errors;
}
