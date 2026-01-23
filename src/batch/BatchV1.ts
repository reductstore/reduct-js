import { APIError } from "../APIError";
import { LabelMap, ReadableRecord } from "../Record";
import { HttpClient } from "../http/HttpClient";
import { createBatchStreamReader } from "./Common";

export async function* fetchAndParseBatchV1(
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
  const url = `/b/${bucket}/${entry}/batch?q=${id}`;
  const resp = head ? await httpClient.head(url) : await httpClient.get(url);

  if (resp.status === 204) {
    throw new APIError(resp.headers.get("x-reduct-error") ?? "No content", 204);
  }

  const { headers, data: body } = resp;

  const { createStream } = createBatchStreamReader(head, body);

  const timeHeaders = [...headers.keys()]
    .filter((k) => k.startsWith("x-reduct-time-"))
    .sort((a, b) => {
      const tsA = BigInt(a.slice(14));
      const tsB = BigInt(b.slice(14));
      return tsA < tsB ? -1 : tsA > tsB ? 1 : 0;
    });
  const total = timeHeaders.length;
  let index = 0;

  for (const h of timeHeaders) {
    const tsStr = h.slice(14);
    const value = headers.get(h);
    if (!value) throw new ErrorEvent(`Invalid header ${h} with value ${value}`);

    const { size, contentType, labels } = parseCsvRow(value);
    const byteLen = Number(size);

    index += 1;
    const isLastInBatch = index === total;
    const isLastInQuery =
      headers.get("x-reduct-last") === "true" && isLastInBatch;

    const stream = await createStream(byteLen, isLastInBatch);

    yield new ReadableRecord(
      entry,
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
