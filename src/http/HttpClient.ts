import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { Readable, Stream } from "stream";
import * as https from "https";
import { ClientOptions, isCompatibale } from "../Client";
import { APIError } from "../APIError";
import { ReadableRecord, LabelMap } from "../Record";

export class HttpClient {
  readonly httpClient: AxiosInstance;
  private readonly isBrowser: boolean;

  constructor(url: string, options: ClientOptions = {}) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bigJson = require("json-bigint")({
      alwaysParseAsBig: false,
      useNativeBigInt: true,
    });

    // Axios config with BigInt support in JSON
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
          // Hack to support BigInt in JSON
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
          // Hack to support BigInt in JSON
          if (typeof data !== "string") {
            return data;
          }
          if (data.length === 0) {
            return {};
          }
          return bigJson.parse(data);
        },
      ],
    };

    // If running in Node, configure httpsAgent (for SSL verification).
    if (typeof window === "undefined") {
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: options.verifySSL !== false,
      });
    }

    this.httpClient = axios.create(axiosConfig);
    this.isBrowser = typeof window !== "undefined";

    // Convert Axios errors into APIError
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error instanceof AxiosError) {
          // throw APIError.from(error);
          throw this.mapAxiosErrorToAPIError(error);
        }
        throw error;
      },
    );
  }

  getResponseType(): "arraybuffer" | "stream" {
    return this.isBrowser ? "arraybuffer" : "stream";
  }

  /**
   * Map AxiosError to APIError
   */
  private mapAxiosErrorToAPIError(error: AxiosError): APIError {
    const original = error;
    let { message } = error;
    let status: number | undefined = undefined;

    const resp = error.response;
    if (resp !== undefined) {
      // eslint-disable-next-line
      status = resp.status;

      const header_msg = resp.headers["x-reduct-error"];
      if (header_msg !== undefined) {
        message = header_msg;
      }
    }

    return new APIError(message, status, original);
  }

  createReadableStreamFromResponse(
    data: any,
    responseType: "arraybuffer" | "stream",
  ): Readable {
    if (responseType === "arraybuffer") {
      const stream = new Stream.Readable();
      stream.push(Buffer.from(data as ArrayBuffer));
      stream.push(null);
      return stream;
    }
    return data as Readable;
  }

  getArrayBufferIfAvailable(data: any): ArrayBuffer | undefined {
    return this.getResponseType() === "arraybuffer"
      ? (data as ArrayBuffer)
      : undefined;
  }

  supportsBatchedRecords(apiVersion: string): boolean {
    return isCompatibale("1.5", apiVersion) && !this.isBrowser;
  }

  createReadableRecord(
    response: { status: number; headers: Record<string, string>; data: any },
    head: boolean,
  ): ReadableRecord {
    const { headers, data } = response;
    const labels: LabelMap = {};

    for (const [key, value] of Object.entries(headers)) {
      if (key.startsWith("x-reduct-label-")) {
        labels[key.substring(15)] = value;
      }
    }

    const stream = this.createReadableStreamFromResponse(
      data,
      this.getResponseType(),
    );

    return new ReadableRecord(
      BigInt(headers["x-reduct-time"] ?? 0),
      BigInt(headers["content-length"] ?? 0),
      headers["x-reduct-last"] == "1",
      head,
      stream,
      labels,
      headers["content-type"] ?? "application/octet-stream",
      this.getArrayBufferIfAvailable(data),
    );
  }

  /* ------------------------------------------------------------------
     BASIC "data only" HELPERS
     ------------------------------------------------------------------ */
  /**
   * Convenience: Perform a GET request, return only `response.data`
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.httpClient.get<T>(url, config);
    return response.data;
  }

  /**
   * Convenience: Perform a POST request, return only `response.data`
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.httpClient.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Convenience: Perform a PUT request, return only `response.data`
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.httpClient.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Convenience: Perform a PATCH request, return only `response.data`
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.httpClient.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Convenience: Perform a DELETE request, return only `response.data`
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.httpClient.delete<T>(url, config);
    return response.data;
  }

  /**
   * Convenience: Perform a HEAD request (usually returns no body).
   * No `response.data` is relevant, so we only resolve success or throw on error.
   */
  async head(url: string, config?: AxiosRequestConfig): Promise<void> {
    await this.httpClient.head(url, config);
  }

  /* ------------------------------------------------------------------
     "FULL RESPONSE" HELPERS (if you need headers, status, etc.)
     ------------------------------------------------------------------ */
  /**
   * Perform a GET request, returning the full AxiosResponse<T>
   */
  async getResponse<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.httpClient.get<T>(url, config);
  }

  /**
   * Convenience: Perform a GET request with specific response type
   */
  async getWithResponseType<T = any>(
    url: string,
    responseType:
      | "arraybuffer"
      | "blob"
      | "stream"
      | "document"
      | "json"
      | "text",
  ): Promise<AxiosResponse<T>> {
    return this.httpClient.get<T>(url, { responseType });
  }

  /**
   * Perform a POST request, returning the full AxiosResponse<T>
   */
  async postResponse<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.httpClient.post<T>(url, data, config);
  }

  /**
   * Perform a PUT request, returning the full AxiosResponse<T>
   */
  async putResponse<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.httpClient.put<T>(url, data, config);
  }

  /**
   * Perform a PATCH request, returning the full AxiosResponse<T>
   */
  async patchResponse<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.httpClient.patch<T>(url, data, config);
  }

  /**
   * Perform a DELETE request, returning the full AxiosResponse<T>
   */
  async deleteResponse<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.httpClient.delete<T>(url, config);
  }

  /**
   * Perform a HEAD request, returning the full AxiosResponse (status, headers, etc.)
   */
  async headResponse(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse> {
    return this.httpClient.head(url, config);
  }

  /**
   * Perform a request with custom config, returning the full AxiosResponse
   */
  async request<T = any>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.httpClient.request<T>(config);
  }
}
