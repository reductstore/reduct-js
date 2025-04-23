import JSONbig from "json-bigint";
import fetch from "cross-fetch";
import { Readable } from "stream";
import { Agent as HttpsAgent } from "https";
import { ClientOptions } from "../Client";
import { APIError } from "../APIError";
import { isBrowser } from "../utils/env";

const bigJson = JSONbig({ alwaysParseAsBig: false, useNativeBigInt: true });

export type FetchResult<T = unknown> = {
  data: T;
  headers: Headers;
  status: number;
};

export class FetchClient {
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

  // ---------- low-level ----------
  private async request<T = unknown>(
    method: string,
    url: string,
    body?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    const controller = new AbortController();
    if (this.timeout) setTimeout(() => controller.abort(), this.timeout);

    const init: RequestInit = {
      method,
      headers: { ...this.headers, ...headers },
      body: this.encodeBody(body),
      signal: controller.signal,
      // @ts-ignore – passed through to Node fetch
      agent: this.agent,
    };

    const response = await fetch(`${this.baseURL}${url}`, init).catch((err) => {
      throw new APIError(err.message, undefined, err);
    });

    if (!response.ok) {
      const message =
        response.headers.get("x-reduct-error") ||
        (await response.text()) ||
        response.statusText;
      throw new APIError(message, response.status, { response });
    }

    const data = (await this.parseResponse(response)) as T;
    return { data, headers: response.headers, status: response.status };
  }

  private encodeBody(data?: unknown): BodyInit | undefined {
    if (
      data === undefined ||
      typeof data === "string" ||
      Buffer.isBuffer(data) ||
      data instanceof Uint8Array ||
      data instanceof Readable ||
      data instanceof ArrayBuffer ||
      data instanceof Blob
    ) {
      return data as BodyInit;
    }
    return bigJson.stringify(data);
  }

  private async parseResponse(
    res: Response,
  ): Promise<object | string | ReadableStream<Uint8Array>> {
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
  get<T = unknown>(url: string): Promise<FetchResult<T>> {
    return this.request<T>("GET", url);
  }

  post<T = unknown>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("POST", url, data, headers);
  }

  put<T = unknown>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("PUT", url, data, headers);
  }

  patch<T = unknown>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("PATCH", url, data, headers);
  }

  delete<T = unknown>(
    url: string,
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("DELETE", url, undefined, headers);
  }

  head<T = unknown>(url: string): Promise<FetchResult<T>> {
    return this.request("HEAD", url);
  }
}
