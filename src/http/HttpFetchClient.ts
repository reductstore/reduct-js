import JSONbig from "json-bigint";
import fetch from "cross-fetch";
import { Readable } from "stream";
import { Agent as HttpsAgent } from "https"; // <-- for Node SSL bypass
import { ClientOptions } from "../Client";
import { APIError } from "../APIError";
import { isBrowser } from "../utils/env";

const bigJson = JSONbig({ alwaysParseAsBig: false, useNativeBigInt: true });

export class FetchClient {
  private baseURL: string;
  private timeout?: number;
  private headers: HeadersInit;
  private agent?: HttpsAgent;

  constructor(url: string, options: ClientOptions = {}) {
    this.baseURL = `${url}/api/v1`;
    this.timeout = options.timeout;
    this.headers = {
      Authorization: `Bearer ${options.apiToken}`,
    };

    // Only in Node.js: allow skipping SSL check
    if (!isBrowser && options.verifySSL === false) {
      this.agent = new HttpsAgent({ rejectUnauthorized: false });
    }
  }

  private async request(
    method: string,
    url: string,
    body?: any,
    headers?: HeadersInit,
  ): Promise<object | string | ReadableStream<Uint8Array>> {
    const controller = new AbortController();
    if (this.timeout) setTimeout(() => controller.abort(), this.timeout);

    const init: RequestInit = {
      method,
      headers: {
        ...this.headers,
        ...headers,
      },
      body: this.encodeBody(body),
      signal: controller.signal,
      // @ts-ignore: cross-fetch doesn't define `agent` but it is passed to Node's fetch
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

    return this.parseResponse(response);
  }

  private encodeBody(data?: any): BodyInit | undefined {
    if (
      data === undefined ||
      typeof data !== "object" ||
      data instanceof Readable ||
      data instanceof ArrayBuffer ||
      data instanceof Blob
    ) {
      return data;
    }
    return bigJson.stringify(data);
  }

  private async parseResponse(
    res: Response,
  ): Promise<object | string | ReadableStream<Uint8Array>> {
    const ct = res.headers.get("content-type") || "";

    if (!res.body) return {};

    if (ct.startsWith("application/json")) {
      const text = await res.text();
      return text ? bigJson.parse(text) : {};
    }

    if (ct.startsWith("text/")) {
      return await res.text();
    }

    return res.body;
  }

  // -------- BASIC REQUEST HELPERS --------
  async get<T = any>(url: string): Promise<T> {
    const result = await this.request("GET", url);
    if (typeof result === "object" && !(result instanceof ReadableStream)) {
      return result as T;
    }
    throw new Error("Unexpected response type");
  }

  post<T = any>(url: string, data?: any): Promise<T> {
    return this.request("POST", url, data) as Promise<T>;
  }

  put<T = any>(url: string, data?: any, headers?: HeadersInit): Promise<T> {
    return this.request("PUT", url, data, headers) as Promise<T>;
  }

  patch<T = any>(url: string, data?: any, headers?: HeadersInit): Promise<T> {
    return this.request("PATCH", url, data, headers) as Promise<T>;
  }

  delete<T = any>(url: string): Promise<T> {
    return this.request("DELETE", url) as Promise<T>;
  }

  head<T = any>(url: string): Promise<T> {
    return this.request("HEAD", url) as Promise<T>;
  }
}
