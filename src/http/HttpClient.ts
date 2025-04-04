import { AxiosInstance } from "axios";
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

export class HttpClient {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  async get<Path extends keyof ApiResponseTypes>(
    url: Path,
  ): Promise<ApiResponseTypes[Path]> {
    return this.axiosInstance.get(url);
  }

  async post<Path extends keyof ApiRequestTypes>(
    url: Path,
    data: ApiRequestTypes[Path],
  ): Promise<any> {
    return this.axiosInstance.post(url, data);
  }
}
