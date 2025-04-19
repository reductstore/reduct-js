/**
 * Represents HTTP Client for ReductStore API
 * @class
 */
import { ServerInfo, OriginalServerInfo } from "./messages/ServerInfo";
import { APIError } from "./APIError";
import { BucketInfo, OriginalBucketInfo } from "./messages/BucketInfo";
import { BucketSettings } from "./messages/BucketSettings";
import { Bucket } from "./Bucket";
import { Token, TokenPermissions, OriginalTokenInfo } from "./messages/Token";
import {
  FullReplicationInfo,
  ReplicationInfo,
  FullReplicationInfoResponse,
  OriginalReplicationInfo,
} from "./messages/ReplicationInfo";
import { ReplicationSettings } from "./messages/ReplicationSettings";
import { HttpClient } from "./http/HttpClient";
import { FetchClient } from "./http/HttpFetchClient";

/**
 * Options
 */
export type ClientOptions = {
  apiToken?: string; // API token for authentication
  timeout?: number; // communication timeout
  verifySSL?: boolean; // verify SSL certificate
};

export class Client {
  private readonly httpClient: HttpClient;
  private readonly fetchClient: FetchClient;

  /**
   * HTTP Client for ReductStore
   * @param url URL to the storage
   * @param options
   */
  constructor(url: string, options: ClientOptions = {}) {
    this.httpClient = new HttpClient(url, options);
    this.fetchClient = new FetchClient(url, options);
  }

  /**
   * Get server information
   * @async
   * @return {Promise<ServerInfo>} the data about the server
   */
  async getInfo(): Promise<ServerInfo> {
    const data = await this.fetchClient.get<OriginalServerInfo>("/info");
    return ServerInfo.parse(data);
  }

  /**
   * Get list of buckets
   * @async
   * @return {BucketInfo[]}
   * @see BucketInfo
   */
  async getBucketList(): Promise<BucketInfo[]> {
    const data = await this.fetchClient.get<{ buckets: OriginalBucketInfo[] }>(
      "/list",
    );
    return data.buckets.map((bucket) => BucketInfo.parse(bucket));
  }

  /**
   * Create a new bucket
   * @param name name of the bucket
   * @param settings optional settings
   * @return {Promise<Bucket>}
   */
  async createBucket(name: string, settings?: BucketSettings): Promise<Bucket> {
    await this.httpClient.post<void>(
      `/b/${name}`,
      settings ? BucketSettings.serialize(settings) : undefined,
    );
    return new Bucket(name, this.httpClient);
  }

  /**
   * Get a bucket by name
   * @param name name of the bucket
   * @return {Promise<Bucket>}
   */
  async getBucket(name: string): Promise<Bucket> {
    await this.httpClient.get<void>(`/b/${name}`);
    return new Bucket(name, this.httpClient);
  }

  /**
   * Try to create a bucket and get it if it already exists
   * @param name name of the bucket
   * @param settings optional settings
   * @return {Promise<Bucket>}
   */
  async getOrCreateBucket(
    name: string,
    settings?: BucketSettings,
  ): Promise<Bucket> {
    try {
      return await this.createBucket(name, settings);
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        return await this.getBucket(name);
      }

      throw error; // pass exception forward
    }
  }

  /**
   * Create a new access token
   * @param name name of the token
   * @param permissions permissions for the token
   * @return {Promise<string>} the token
   *
   * @example
   * const token = await client.createToken("my-token", {fullAccess: true});
   * const client = new Client("https://play.storage-reduct.dev", {apiToken: token});
   */

  async createToken(
    name: string,
    permissions: TokenPermissions,
  ): Promise<string> {
    const data = await this.httpClient.post<{ value: string }>(
      `/tokens/${name}`,
      TokenPermissions.serialize(permissions),
    );
    return data.value;
  }

  /**
   * Get a token by name
   * @param name name of the token
   * @return {Promise<Token>} the token
   */
  async getToken(name: string): Promise<Token> {
    const data = await this.fetchClient.get<OriginalTokenInfo>(
      `/tokens/${name}`,
    );
    return Token.parse(data);
  }

  /**
   * List all tokens
   * @return {Promise<Token[]>} the list of tokens
   */
  async getTokenList(): Promise<Token[]> {
    const data = await this.fetchClient.get<{ tokens: OriginalTokenInfo[] }>(
      "/tokens",
    );
    return data.tokens.map((token) => Token.parse(token));
  }

  /**
   * Delete a token by name
   * @param name name of the token
   */
  async deleteToken(name: string): Promise<void> {
    await this.httpClient.delete<void>(`/tokens/${name}`);
  }

  /**
   * Get current API token and its permissions
   * @return {Promise<Token>} the token
   */
  async me(): Promise<Token> {
    const data = await this.fetchClient.get<OriginalTokenInfo>("/me");
    return Token.parse(data);
  }

  /**
   * Get the list of replications
   * @return {Promise<ReplicationInfo[]>} the list of replications
   */
  async getReplicationList(): Promise<ReplicationInfo[]> {
    const data = await this.fetchClient.get<{
      replications: OriginalReplicationInfo[];
    }>("/replications");
    return data.replications.map((replication) =>
      ReplicationInfo.parse(replication),
    );
  }

  /**
   * Get full information about a replication
   * @param name name of the replication
   * @return {Promise<FullReplicationInfo>} the replication
   */
  async getReplication(name: string): Promise<FullReplicationInfo> {
    const data = await this.fetchClient.get<FullReplicationInfoResponse>(
      `/replications/${name}`,
    );
    return FullReplicationInfo.parse(data);
  }

  /**
   * Create a new replication
   * @param name name of the replication
   * @param settings settings of the replication
   * @return {Promise<void>}
   */
  async createReplication(
    name: string,
    settings: ReplicationSettings,
  ): Promise<void> {
    await this.httpClient.post<void>(
      `/replications/${name}`,
      ReplicationSettings.serialize(settings),
    );
  }

  /**
   * Update a replication
   * @param name name of the replication
   * @param settings settings of the replication
   * @return {Promise<void>}
   */
  async updateReplication(
    name: string,
    settings: ReplicationSettings,
  ): Promise<void> {
    await this.httpClient.put<void>(
      `/replications/${name}`,
      ReplicationSettings.serialize(settings),
    );
  }

  /**
   * Delete a replication
   * @param name name of the replication
   * @return {Promise<void>}
   */
  async deleteReplication(name: string): Promise<void> {
    await this.httpClient.delete<void>(`/replications/${name}`);
  }
}

export const isCompatibale = (
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
