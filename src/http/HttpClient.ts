import { AxiosInstance } from "axios";
import { OriginalServerInfo } from "../messages/ServerInfo";
import { OriginalBucketInfo } from "../messages/BucketInfo";
import { OriginalTokenInfo } from "../messages/Token";
import {
  FullReplicationInfoResponse,
  OriginalReplicationInfo,
} from "../messages/ReplicationInfo";

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

export class HttpClient {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  async get<Path extends keyof ApiResponseTypes>(
    url: Path,
  ): Promise<ApiResponseTypes[Path]> {
    return this.axiosInstance.get(url);
  }
}
