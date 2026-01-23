import { APIError } from "../APIError";
import { LabelMap, ReadableRecord } from "../Record";
import { HttpClient } from "../http/HttpClient";
import { createBatchStreamReader } from "./Common";

type RecordHeader = {
  contentLength: bigint;
  contentType: string;
  labels: LabelMap;
};

const HEADER_PREFIX = "x-reduct-";
const ERROR_HEADER_PREFIX = "x-reduct-error-";
const ENTRIES_HEADER = "x-reduct-entries";
const START_TS_HEADER = "x-reduct-start-ts";
const LABELS_HEADER = "x-reduct-labels";
const LAST_HEADER = "x-reduct-last";

export async function* fetchAndParseBatchV2(
  bucket: string,
  entry: string,
  id: string,
  continueQuery: boolean,
  poolInterval: number,
  head: boolean,
  httpClient: HttpClient,
) {
  while (true) {
    try {
      for await (const record of readBatchedRecords(
        bucket,
        entry,
        head,
        id,
        httpClient,
      )) {
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

async function* readBatchedRecords(
  bucket: string,
  entry: string,
  head: boolean,
  id: string,
  httpClient: HttpClient,
): AsyncGenerator<ReadableRecord> {
  void entry;
  const url = `/io/${bucket}/read`;
  const requestHeaders = { "x-reduct-query-id": id };
  const resp = head
    ? await httpClient.head(url, requestHeaders)
    : await httpClient.get(url, requestHeaders);

  if (resp.status === 204) {
    throw new APIError(resp.headers.get("x-reduct-error") ?? "No content", 204);
  }

  const { headers: responseHeaders, data: body } = resp;

  const { createStream } = createBatchStreamReader(head, body);

  const entriesHeader = responseHeaders.get(ENTRIES_HEADER);
  if (!entriesHeader) {
    throw new Error("x-reduct-entries header is required");
  }

  const startTsHeader = responseHeaders.get(START_TS_HEADER);
  if (!startTsHeader) {
    throw new Error("x-reduct-start-ts header is required");
  }

  const entries = parseHeaderList(entriesHeader);
  const startTs = parseBigIntHeader(startTsHeader);

  const labelNamesHeader = responseHeaders.get(LABELS_HEADER);
  const labelNames = labelNamesHeader
    ? parseHeaderList(labelNamesHeader)
    : undefined;

  const recordHeaders = sortHeadersByEntryAndTime(responseHeaders);
  const total = recordHeaders.length;
  let index = 0;
  const lastHeader = responseHeaders.get(LAST_HEADER) === "true";
  const lastHeaderPerEntry = new Map<number, RecordHeader>();

  for (const { entryIndex, delta, rawValue } of recordHeaders) {
    const entryName = entries[entryIndex];
    if (!entryName) {
      throw new Error(
        `Invalid header '${HEADER_PREFIX}${entryIndex}-${delta.toString()}': entry index out of range`,
      );
    }

    const header = parseRecordHeaderWithDefaults(
      rawValue,
      lastHeaderPerEntry.get(entryIndex),
      labelNames,
    );

    lastHeaderPerEntry.set(entryIndex, header);

    const timestamp = startTs + delta;
    const byteLen = Number(header.contentLength);

    index += 1;
    const isLastInBatch = index === total;
    const isLastInQuery = lastHeader && isLastInBatch;

    const stream = await createStream(byteLen, isLastInBatch);

    yield new ReadableRecord(
      entryName,
      timestamp,
      header.contentLength,
      isLastInQuery,
      head,
      stream,
      header.labels,
      header.contentType,
    );
  }
}

function sortHeadersByEntryAndTime(headers: Headers): {
  entryIndex: number;
  delta: bigint;
  rawValue: string;
}[] {
  const parsed: { entryIndex: number; delta: bigint; rawValue: string }[] = [];
  for (const [name, value] of headers.entries()) {
    if (!name.startsWith(HEADER_PREFIX)) {
      continue;
    }

    if (
      name === ENTRIES_HEADER ||
      name === START_TS_HEADER ||
      name === LABELS_HEADER ||
      name === LAST_HEADER ||
      name.startsWith(ERROR_HEADER_PREFIX)
    ) {
      continue;
    }

    const suffix = name.slice(HEADER_PREFIX.length);
    const lastDash = suffix.lastIndexOf("-");
    if (lastDash === -1) {
      continue;
    }

    const entryIndexRaw = suffix.slice(0, lastDash);
    const deltaRaw = suffix.slice(lastDash + 1);

    if (!/^\d+$/.test(entryIndexRaw) || !/^\d+$/.test(deltaRaw)) {
      continue;
    }

    const entryIndex = Number(entryIndexRaw);
    const delta = BigInt(deltaRaw);
    parsed.push({ entryIndex, delta, rawValue: value });
  }

  parsed.sort((a, b) => {
    if (a.entryIndex !== b.entryIndex) {
      return a.entryIndex - b.entryIndex;
    }
    return a.delta < b.delta ? -1 : a.delta > b.delta ? 1 : 0;
  });

  return parsed;
}

function parseRecordHeaderWithDefaults(
  raw: string,
  previous: RecordHeader | undefined,
  labelNames: string[] | undefined,
): RecordHeader {
  const commaIndex = raw.indexOf(",");
  const contentLengthRaw =
    commaIndex === -1 ? raw.trim() : raw.slice(0, commaIndex).trim();

  const contentLength = parseBigIntHeader(contentLengthRaw);
  if (commaIndex === -1) {
    if (!previous) {
      throw new Error(
        "Content-type and labels must be provided for the first record of an entry",
      );
    }

    return {
      contentLength,
      contentType: previous.contentType,
      labels: { ...previous.labels },
    };
  }

  const rest = raw.slice(commaIndex + 1);
  const nextComma = rest.indexOf(",");
  const contentTypeRaw = nextComma === -1 ? rest : rest.slice(0, nextComma);
  const labelsRaw = nextComma === -1 ? undefined : rest.slice(nextComma + 1);

  const contentType = contentTypeRaw.trim()
    ? contentTypeRaw.trim()
    : previous
      ? previous.contentType
      : "application/octet-stream";

  const labels =
    labelsRaw === undefined
      ? previous
        ? { ...previous.labels }
        : {}
      : applyLabelDelta(labelsRaw, previous?.labels ?? {}, labelNames);

  return {
    contentLength,
    contentType,
    labels,
  };
}

function applyLabelDelta(
  rawLabels: string,
  base: LabelMap,
  labelNames: string[] | undefined,
): LabelMap {
  const labels: LabelMap = { ...base };
  for (const [key, value] of parseLabelDeltaOps(rawLabels, labelNames)) {
    if (value === null) {
      delete labels[key];
    } else {
      labels[key] = value;
    }
  }
  return labels;
}

function parseLabelDeltaOps(
  rawLabels: string,
  labelNames: string[] | undefined,
): Array<[string, string | null]> {
  const ops: Array<[string, string | null]> = [];
  let rest = rawLabels.trim();

  if (!rest) {
    return ops;
  }

  while (rest.length > 0) {
    const eqIndex = rest.indexOf("=");
    if (eqIndex === -1) {
      throw new Error("Invalid batched header");
    }

    const rawKey = rest.slice(0, eqIndex).trim();
    const key = resolveLabelName(rawKey, labelNames);

    let valuePart = rest.slice(eqIndex + 1);
    let value = "";
    let nextRest = "";

    if (valuePart.startsWith('"')) {
      valuePart = valuePart.slice(1);
      const endQuote = valuePart.indexOf('"');
      if (endQuote === -1) {
        throw new Error("Invalid batched header");
      }
      value = valuePart.slice(0, endQuote).trim();
      nextRest = valuePart.slice(endQuote + 1).trim();
      if (nextRest.startsWith(",")) {
        nextRest = nextRest.slice(1).trim();
      }
    } else {
      const nextComma = valuePart.indexOf(",");
      if (nextComma === -1) {
        value = valuePart.trim();
        nextRest = "";
      } else {
        value = valuePart.slice(0, nextComma).trim();
        nextRest = valuePart.slice(nextComma + 1).trim();
      }
    }

    ops.push([key, value === "" ? null : value]);

    if (!nextRest) {
      return ops;
    }

    rest = nextRest;
  }

  return ops;
}

function resolveLabelName(
  raw: string,
  labelNames: string[] | undefined,
): string {
  if (labelNames && /^\d+$/.test(raw)) {
    const idx = Number(raw);
    const name = labelNames[idx];
    if (!name) {
      throw new Error(`Label index '${raw}' is out of range`);
    }
    return name;
  }

  if (raw.startsWith("@")) {
    throw new Error(
      "Label names must not start with '@': reserved for computed labels",
    );
  }

  return raw;
}

function parseHeaderList(header: string): string[] {
  const trimmed = header.trim();
  if (!trimmed) {
    throw new Error("Invalid entries/labels header");
  }
  return trimmed.split(",").map((item) => decodeHeaderComponent(item.trim()));
}

function parseBigIntHeader(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new Error("Invalid batched header");
  }
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
