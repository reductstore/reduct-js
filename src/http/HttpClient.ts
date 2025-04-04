import { AxiosInstance } from "axios";
import { Original } from "../messages/ServerInfo";

export interface ApiResponseTypes {
  "/info": { data: Original };
}

export class HttpClient {
  constructor(private readonly axiosInstance: AxiosInstance) { }

  async get<Path extends keyof ApiResponseTypes>(
    url: Path
  ): Promise<ApiResponseTypes[Path]> {
    return this.axiosInstance.get(url);
  }
}
