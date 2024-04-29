// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { AxiosError } from "axios";

/**
 * Represents HTTP Error
 */
export class APIError {
  /**
   * HTTP status of error. If it is empty, it means communication problem
   */
  public status?: number;

  /**
   * Parsed message from the storage engine
   */
  public message?: string;

  /**
   * Original error from HTTP client with the full information
   */
  public original?: AxiosError;

  /**
   * Create an error from AxiosError
   * @param error {AxiosError}
   */
  static from(error: AxiosError): APIError {
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

  /**
   * Create an error from HTTP status and message
   */
  constructor(message: string, status?: number, original?: AxiosError) {
    this.status = status;
    this.message = message;
    this.original = original;
  }
}
