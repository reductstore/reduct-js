// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {AxiosError} from "axios";

/**
 * Represents HTTP Error
 */
export class APIError {
    public status?: number;
    public message?: string;

    /**
     * Create an error from AxiosError
     * @param error {AxiosError}
     */
    static from(error: AxiosError): APIError {
        const apiError: APIError = {
            message: error.message,
        };

        const resp = error.response;
        if (resp !== undefined) {
            apiError.status = resp.status;
            if (resp.data !== undefined) {
                const {detail} = resp.data;
                if (detail !== undefined) {
                    apiError.message += ": " + detail;
                }
            }
        }

        return apiError;
    }
}
