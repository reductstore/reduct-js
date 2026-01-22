import { Client } from "../../src/Client";
import * as process from "process";
// @ts-ignore
import request from "sync-request";
import { isBrowser } from "../../src/utils/env";
import { Status } from "../../src/messages/Status";

const DELETE_TIMEOUT_MS = 15000;
const DELETE_POLL_INTERVAL_MS = 200;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForBucketRemoval = async (
  client: Client,
  name: string,
): Promise<void> => {
  const deadline = Date.now() + DELETE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const buckets = await client.getBucketList();
    const bucketInfo = buckets.find((bucket) => bucket.name === name);
    if (!bucketInfo) {
      return;
    }

    if (bucketInfo.status !== Status.DELETING) {
      try {
        const bucket = await client.getBucket(name);
        await bucket.remove();
      } catch {
        console.warn(`Bucket '${name}' removal failed, retrying...`);
      }
    }

    await delay(DELETE_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for bucket '${name}' deletion`);
};

/**
 * Remove all buckets
 * @param client
 */
export const cleanStorage = async (client: Client): Promise<void> => {
  // Delete buckets sequentially to avoid race conditions
  const buckets = await client.getBucketList();
  for (const info of buckets) {
    try {
      const bucket = await client.getBucket(info.name);
      await bucket.remove();
    } catch {
      // Ignore errors (bucket may have been removed by a test)
    }

    await waitForBucketRemoval(client, info.name);
  }

  // Delete tokens sequentially
  const tokens = await client.getTokenList();
  for (const token of tokens) {
    if (token.name !== "init-token") {
      try {
        await client.deleteToken(token.name);
      } catch {
        // Ignore errors (token may have been removed by a test)
      }
    }
  }
};

export const makeClient = (): Client => {
  return new Client("http://127.0.0.1:8383", {
    apiToken: process.env.RS_API_TOKEN,
    timeout: 10000,
  });
};

export const it_api = (version: string, skip_browser = false) => {
  if (skip_browser && isBrowser) return it.skip;
  const resp = request("HEAD", "http://127.0.0.1:8383/api/v1/alive");
  const api_version = resp.headers["x-reduct-api"] ?? "0.0";
  if (isCompatible(version, api_version.toString())) {
    return it;
  } else {
    return it.skip;
  }
};

export const it_env = (name: string) => {
  const variable = process.env[name];
  if (variable !== undefined && variable.length > 0) {
    return it;
  } else {
    return it.skip;
  }
};

export const u8 = (s: string) => new TextEncoder().encode(s);

const isCompatible = (
  min_version?: string,
  current_version?: string,
): boolean => {
  if (min_version === undefined || current_version === undefined) {
    return false;
  }

  const [a_major, a_minor] = min_version.split(".").map((v) => parseInt(v));
  const [b_major, b_minor] = current_version.split(".").map((v) => parseInt(v));

  return a_major === b_major && a_minor <= b_minor;
};
