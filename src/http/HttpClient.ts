import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { AxiosRequestConfig } from "../../node_modules/axios/index";

import { Readable } from "stream";
import * as https from "https";

import { OriginalServerInfo } from "../messages/ServerInfo";
import { OriginalBucketInfo } from "../messages/BucketInfo";
import { OriginalTokenInfo } from "../messages/Token";
import {
  FullReplicationInfoResponse,
  OriginalReplicationInfo,
} from "../messages/ReplicationInfo";
import { OriginalTokenPermission } from "../messages/Token";

import { OriginalBucketSettings } from "../messages/BucketSettings";
import { OriginalReplicationSettings } from "../messages/ReplicationSettings";
import { ClientOptions } from "../Client";
import { APIError } from "../APIError";

export interface ApiResponseTypes {
  "/info": { data: OriginalServerInfo };
  "/list": { data: { buckets: OriginalBucketInfo[] } };
  "/tokens": { data: { tokens: OriginalTokenInfo[] } };
  "/me": { data: OriginalTokenInfo };
  "/replications": { data: { replications: OriginalReplicationInfo[] } };
  [key: `/b/${string}`]: { data: OriginalBucketInfo };
  [key: `/tokens/${string}`]: { data: OriginalTokenInfo };
  [key: `/replications/${string}`]: { data: FullReplicationInfoResponse };
}

export interface ApiRequestTypes {
  [key: `/b/${string}`]: OriginalBucketSettings | undefined;
  [key: `/tokens/${string}`]: OriginalTokenPermission;
  [key: `/replications/${string}`]: OriginalReplicationSettings;
}

export interface ApiDeleteEndpoints {
  [key: `/tokens/${string}`]: void;
  [key: `/replications/${string}`]: void;
}

export class HttpClient {
  readonly httpClient: AxiosInstance;

  constructor(url: string, options: ClientOptions = {}) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bigJson = require("json-bigint")({
      alwaysParseAsBig: false,
      useNativeBigInt: true,
    });

    // http client with big int support in JSON
    const axiosConfig: AxiosRequestConfig = {
      baseURL: `${url}/api/v1`,
      timeout: options.timeout,
      headers: {
        Authorization: `Bearer ${options.apiToken}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      transformRequest: [
        (data: any) => {
          // very ugly hack to support big int in JSON
          if (
            typeof data !== "object" ||
            data instanceof Readable ||
            data instanceof Buffer
          ) {
            return data;
          }
          return bigJson.stringify(data);
        },
      ],
      transformResponse: [
        (data: any) => {
          // very ugly hack to support big int in JSON
          if (typeof data !== "string") {
            return data;
          }

          if (data.length == 0) {
            return {};
          }
          return bigJson.parse(data);
        },
      ],
    };
    if (typeof window === "undefined") {
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: options.verifySSL !== false,
      });
    }
    this.httpClient = axios.create(axiosConfig);

    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error instanceof AxiosError) {
          throw APIError.from(error);
        }

        throw error;
      },
    );
  }

  async get<Path extends keyof ApiResponseTypes>(
    url: Path,
  ): Promise<ApiResponseTypes[Path]> {
    return this.httpClient.get(url);
  }

  async post<Path extends keyof ApiRequestTypes>(
    url: Path,
    data: ApiRequestTypes[Path],
  ): Promise<any> {
    return this.httpClient.post(url, data);
  }

  async put<Path extends keyof ApiRequestTypes>(
    url: Path,
    data: ApiRequestTypes[Path],
  ): Promise<any> {
    return this.httpClient.put(url, data);
  }

  async delete<Path extends keyof ApiDeleteEndpoints>(
    url: Path,
  ): Promise<void> {
    return this.httpClient.delete(url);
  }
}
