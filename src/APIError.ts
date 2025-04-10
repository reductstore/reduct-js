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
  public original?: unknown;

  /**
   * Create an error from HTTP status and message
   */
  constructor(message: string, status?: number, original?: unknown) {
    this.status = status;
    this.message = message;
    this.original = original;
  }
}
