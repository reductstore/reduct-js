import JSONbig from "json-bigint";
import { Agent as HttpsAgent } from "https";
import { ClientOptions } from "../Client";
import { APIError } from "../APIError";
import { isBrowser } from "../utils/env";
import { Buffer } from "buffer";

const bigJson = JSONbig({ alwaysParseAsBig: false, useNativeBigInt: true });

export type ValidResponse = object | string | ReadableStream<Uint8Array>;

export type FetchResult<T extends ValidResponse = ValidResponse> = {
  data: T;
  headers: Headers;
  status: number;
};

export class HttpClient {
  private baseURL: string;
  private timeout?: number;
  private headers: HeadersInit;
  private agent?: HttpsAgent;

  constructor(url: string, options: ClientOptions = {}) {
    this.baseURL = `${url}/api/v1`;
    this.timeout = options.timeout;
    this.headers = { Authorization: `Bearer ${options.apiToken}` };

    if (!isBrowser && options.verifySSL === false) {
      this.agent = new HttpsAgent({ rejectUnauthorized: false });
    }
  }

  // ---------- request overloads ----------
  private async request(
    method: "HEAD",
    url: string,
    body?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<Record<string, never>>>;

  private async request<T extends ValidResponse>(
    method: "GET",
    url: string,
    body?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>>;

  private async request<T extends ValidResponse>(
    method: string,
    url: string,
    body?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>>;

  // ---------- request implementation ----------
  private async request<T extends ValidResponse>(
    method: string,
    url: string,
    body?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    const controller = new AbortController();
    const { signal } = controller;

    const { timeout } = this;
    let abortedByTimeout = false;
    if (timeout) {
      setTimeout(() => {
        abortedByTimeout = true;
        controller.abort();
      }, timeout);
    }

    const init: RequestInit = {
      method,
      headers: { ...this.headers, ...headers },
      body: this.encodeBody(body),
      signal: signal,
      // @ts-ignore Node.js only
      agent: this.agent,
      duplex: body instanceof ReadableStream ? "half" : undefined,
    };

    const response = await fetch(`${this.baseURL}${url}`, init).catch((err) => {
      if (abortedByTimeout)
        throw new APIError(
          `timeout of ${this.timeout}ms exceeded`,
          undefined,
          err,
        );
      if (signal.aborted) throw new APIError("Request aborted", undefined, err);
      throw new APIError(err.message, undefined, err);
    });

    if (!response.ok) {
      const message =
        response.headers.get("x-reduct-error") || response.statusText;
      throw new APIError(message, response.status, { response });
    }

    const data = (await this.parseResponse(response)) as T;

    return {
      data,
      headers: response.headers,
      status: response.status,
    };
  }

  private encodeBody(data?: unknown): BodyInit | undefined {
    if (
      data === undefined ||
      typeof data === "string" ||
      Buffer.isBuffer(data) ||
      data instanceof Uint8Array ||
      data instanceof ArrayBuffer ||
      data instanceof Blob ||
      data instanceof ReadableStream
    ) {
      return data as BodyInit;
    }

    return bigJson.stringify(data);
  }

  private async parseResponse(
    res: Response,
  ): Promise<object | string | ReadableStream<Uint8Array>> {
    if (res.status === 204) return {};
    const ct = res.headers.get("content-type") ?? "";

    if (!res.body) return {};

    if (ct.startsWith("application/json")) {
      const text = await res.text();
      return text ? bigJson.parse(text) : {};
    }

    if (ct.startsWith("text/")) {
      return res.text();
    }

    return res.body;
  }

  // ---------- helpers ----------
  get<T extends ValidResponse = ValidResponse>(
    url: string,
  ): Promise<FetchResult<T>> {
    return this.request<T>("GET", url);
  }

  post<T extends ValidResponse = ValidResponse>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("POST", url, data, headers);
  }

  put<T extends ValidResponse = ValidResponse>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("PUT", url, data, headers);
  }

  patch<T extends ValidResponse = ValidResponse>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("PATCH", url, data, headers);
  }

  delete<T extends ValidResponse = ValidResponse>(
    url: string,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("DELETE", url, undefined, headers);
  }

  head(url: string): Promise<FetchResult<Record<string, never>>> {
    return this.request("HEAD", url);
  }
}
