import { AxiosInstance } from "axios";

export class HttpClient {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  async get<T>(url: string): Promise<{ data: T }> {
    return this.axiosInstance.get<T>(url);
  }
}
