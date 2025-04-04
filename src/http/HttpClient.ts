import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { AxiosRequestConfig } from "../../node_modules/axios/index";

import { Readable } from "stream";
import * as https from "https";

import { ClientOptions } from "../Client";
import { APIError } from "../APIError";

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

  async get<T>(url: string): Promise<T> {
    const response = await this.httpClient.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.httpClient.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data: any): Promise<T> {
    const response = await this.httpClient.put<T>(url, data);
    return response.data;
  }

  async delete<T = void>(url: string): Promise<T> {
    const response = await this.httpClient.delete<T>(url);
    return response.data;
  }
}
