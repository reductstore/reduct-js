import { Bucket } from "../../src/Bucket";
import { Client, isCompatibale } from "../../src/Client";
import * as process from "process";
// @ts-ignore
import request from "sync-request";
import { isBrowser } from "../../src/utils/env";

/**
 * Remove all buckets
 * @param client
 */
export const cleanStorage = async (client: Client): Promise<void> => {
  return client
    .getBucketList()
    .then((buckets) => {
      return Promise.all(
        buckets.map((info) => {
          return client.getBucket(info.name).then((bucket: Bucket) => {
            return bucket.remove();
          });
        }),
      );
    })
    .then(() => client.getTokenList())
    .then((tokens) => {
      return Promise.all(
        tokens
          .filter((token) => token.name != "init-token")
          .map((token) => {
            return client.deleteToken(token.name);
          }),
      );
    })
    .then(() => Promise.resolve());
};

export const makeClient = (): Client => {
  return new Client("http://127.0.0.1:8383", {
    apiToken: process.env.RS_API_TOKEN,
  });
};

export const it_api = (version: string, skip_browser = false) => {
  if (skip_browser && isBrowser) return it.skip;
  const resp = request("HEAD", "http://localhost:8383/api/v1/alive");
  const api_version = resp.headers["x-reduct-api"] ?? "0.0";
  if (isCompatibale(version, api_version.toString())) {
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

export const itIfNode = () => {
  if (!isBrowser) {
    return it;
  } else {
    return it.skip;
  }
};
