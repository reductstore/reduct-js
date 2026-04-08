import JSONbig from "json-bigint";
import { ClientOptions, CookieJar } from "../Client";
import { APIError } from "../APIError";
import { isBrowser } from "../utils/env";
import { Buffer } from "buffer";
import { PACKAGE_VERSION } from "../version";

const bigJson = JSONbig({ alwaysParseAsBig: false, useNativeBigInt: true });

let undiciAgent: any = null;
let undiciFetchImpl: typeof fetch | undefined;

if (!isBrowser) {
  try {
    // Use require to load undici at runtime, avoiding static analysis by bundlers.
    // "undici" is a Node.js-only dependency that is not available in browser environments.
    const { Agent, fetch } = require("undici");
    undiciFetchImpl = fetch as typeof globalThis.fetch;
    undiciAgent = new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  } catch {
    // undici not available (browser build or missing dep) — fall back to native fetch
  }
}

export type ValidResponse = object | string | ReadableStream<Uint8Array>;

export type FetchResult<T extends ValidResponse = ValidResponse> = {
  data: T;
  headers: Headers;
  status: number;
};

class InMemoryCookieJar implements CookieJar {
  private readonly cookies = new Map<string, string>();

  getCookieHeader(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined;
    }

    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  setCookies(setCookieHeaders: string[]): void {
    for (const header of setCookieHeaders) {
      const firstPair = header.split(";")[0]?.trim();
      if (!firstPair) {
        continue;
      }

      const equalPos = firstPair.indexOf("=");
      if (equalPos <= 0) {
        continue;
      }

      const name = firstPair.slice(0, equalPos).trim();
      const value = firstPair.slice(equalPos + 1).trim();
      if (!name) {
        continue;
      }

      this.cookies.set(name, value);
    }
  }
}

const getSetCookieHeaders = (headers: Headers): string[] => {
  const maybeUndiciHeaders = headers as Headers & {
    getSetCookie?: () => string[];
    raw?: () => Record<string, string[]>;
  };

  if (typeof maybeUndiciHeaders.getSetCookie === "function") {
    return maybeUndiciHeaders.getSetCookie();
  }

  if (typeof maybeUndiciHeaders.raw === "function") {
    const raw = maybeUndiciHeaders.raw();
    return raw["set-cookie"] ?? [];
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
};

export class HttpClient {
  private baseURL: string;
  private readonly timeout?: number;
  private readonly headers: HeadersInit;
  private readonly dispatcher?: any;
  private readonly fetchImpl: typeof fetch;
  public apiVersion?: [number, number];
  private readonly keepAlive: boolean;
  private readonly stickySessions: boolean;
  private readonly cookieJar?: CookieJar;

  constructor(url: string, options: ClientOptions = {}) {
    this.baseURL = `${url}/api/v1`;
    this.timeout = options.timeout;
    this.keepAlive = options.keepAlive ?? false;
    this.stickySessions = options.stickySessions ?? !isBrowser;
    this.cookieJar = this.stickySessions
      ? (options.cookieJar ?? new InMemoryCookieJar())
      : undefined;
    this.headers = {
      Authorization: `Bearer ${options.apiToken}`,
      ...(!isBrowser && !this.keepAlive ? { Connection: "close" } : {}),
    };

    if (!isBrowser && options.verifySSL === false) {
      this.dispatcher = undiciAgent;
    }

    this.fetchImpl =
      this.dispatcher && undiciFetchImpl
        ? undiciFetchImpl
        : globalThis.fetch.bind(globalThis);
  }

  async close(): Promise<void> {
    if (isBrowser) {
      return;
    }

    if (this.dispatcher?.close) {
      await this.dispatcher.close();
      return;
    }

    // Fall back to closing the global dispatcher to release keep-alive sockets.
    const undici = await import(/* webpackIgnore: true */ "undici");
    const dispatcher = undici.getGlobalDispatcher?.();
    if (dispatcher?.destroy) {
      dispatcher.destroy();
      return;
    }
    if (dispatcher?.close) {
      await dispatcher.close();
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

    const encodedBody = this.encodeBody(body);
    const hasReadableStream =
      typeof ReadableStream !== "undefined" &&
      encodedBody instanceof ReadableStream;

    const requestHeaders: HeadersInit = { ...this.headers, ...headers };

    if (this.stickySessions) {
      const cookieHeader = this.cookieJar?.getCookieHeader();
      if (cookieHeader) {
        (requestHeaders as Record<string, string>)["Cookie"] = cookieHeader;
      }
    }

    const init: RequestInit = {
      method,
      headers: requestHeaders,
      signal: signal,
    };

    if (isBrowser && this.stickySessions) {
      init.credentials = "include";
    }

    if (encodedBody !== undefined) {
      init.body = encodedBody;
    }

    if (this.dispatcher) {
      // @ts-ignore Node.js only
      init.dispatcher = this.dispatcher;
    }

    if (hasReadableStream) {
      // @ts-ignore Node.js only
      init.duplex = "half";
    }

    const response = await this.fetchImpl(`${this.baseURL}${url}`, init).catch(
      (err) => {
        if (abortedByTimeout)
          throw new APIError(
            `timeout of ${this.timeout}ms exceeded`,
            undefined,
            err,
          );
        if (signal.aborted)
          throw new APIError("Request aborted", undefined, err);
        throw new APIError(err.message, undefined, err);
      },
    );

    if (this.stickySessions) {
      const setCookieHeaders = getSetCookieHeaders(response.headers);
      if (setCookieHeaders.length > 0) {
        this.cookieJar?.setCookies(setCookieHeaders);
      }
    }

    const apiVersionHeader = response.headers.get("x-reduct-api");
    if (!apiVersionHeader)
      throw new APIError("Server did not provide API version", undefined, {
        response,
      });

    this.apiVersion = checkServeApiVersion(apiVersionHeader);

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
    headers?: HeadersInit,
  ): Promise<FetchResult<T>> {
    return this.request<T>("GET", url, undefined, headers);
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

  head(
    url: string,
    headers?: HeadersInit,
  ): Promise<FetchResult<Record<string, never>>> {
    return this.request("HEAD", url, undefined, headers);
  }
}

const checkServeApiVersion = (serverApiVersion: string): [number, number] => {
  const [server_major, server_minor] = serverApiVersion
    .split(".")
    .map((v) => parseInt(v));

  const [client_major, client_minor] = PACKAGE_VERSION.split(".").map((v) =>
    parseInt(v),
  );

  if (server_major !== client_major) {
    throw new APIError(
      `Incompatible server API version: ${serverApiVersion}. Client version: ${PACKAGE_VERSION}. Please update your client.`,
    );
  }

  if (server_minor + 2 < client_minor) {
    console.error(
      `Server API version ${serverApiVersion} is too old for this client version ${PACKAGE_VERSION}. Please update your server.`,
    );
  }

  return [server_major, server_minor];
};
