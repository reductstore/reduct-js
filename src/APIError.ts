// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {AxiosError} from "axios";

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
        const apiError = new APIError();
        apiError.original = error;
        apiError.message = error.message;

        const resp = error.response;
        if (resp !== undefined) {
            apiError.status = resp.status;
            if (resp.data !== undefined) {
                // @ts-ignore
                const {detail} = resp.data;
                if (detail !== undefined) {
                    apiError.message += ": " + detail;
                }
            }
        }

        return apiError;
    }
}
