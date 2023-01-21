import Stream from "stream";
// @ts-ignore`
import {AxiosInstance} from "axios";


export type LabelMap = Record<string, string | number | boolean | bigint>

/**
 * Represents a record in an entry for reading
 */
export class ReadableRecord {
    public readonly time: bigint;
    public readonly size: bigint;
    public readonly last: boolean;
    public readonly stream: Stream;
    public readonly labels: LabelMap = {};

    /**
     * Constructor which should be call from Bucket
     * @internal
     */
    public constructor(time: bigint, size: bigint, last: boolean, stream: Stream, labels: LabelMap) {
        this.time = time;
        this.size = size;
        this.last = last;
        this.stream = stream;
        this.labels = labels;
    }

    /**
     * Read content of record
     */
    public async read(): Promise<Buffer> {
        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
            this.stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            this.stream.on("error", (err: Error) => reject(err));
            this.stream.on("end", () => resolve(Buffer.concat(chunks)));
        });
    }

    /**
     * Read content of record and convert to string
     */
    public async readAsString(): Promise<string> {
        return (await this.read()).toString();
    }
}

/**
 * Represents a record in an entry for writing
 */
export class WritableRecord {
    public readonly time: bigint;
    private readonly bucketName: string;
    private readonly entryName: string;
    private readonly httpClient: AxiosInstance;
    private readonly labels: LabelMap = {};

    /**
     * Constructor for stream
     * @internal
     */
    public constructor(bucketName: string, entryName: string, time: bigint, httpClient: AxiosInstance, labels: LabelMap) {
        this.bucketName = bucketName;
        this.entryName = entryName;
        this.time = time;
        this.httpClient = httpClient;
        this.labels = labels;
    }

    /**
     * Write data to record asynchronously
     * @param data stream of buffer with data
     * @param size size of data in bytes (only for streams)
     */
    public async write(data: Buffer | string | Stream, size?: bigint | number): Promise<void> {
        let contentLength = size || 0;
        if (!(data instanceof Stream)) {
            contentLength = data.length;
        }

        const headers: Record<string, string> = {
            "Content-Length": contentLength.toString(),
            "Content-Type": "application/octet-stream"
        };

        for (const [key, value] of Object.entries(this.labels)) {
            headers[`x-reduct-label-${key}`] = value.toString();
        }

        const {bucketName, entryName, time} = this;
        await this.httpClient.post(`/b/${bucketName}/${entryName}?ts=${time}`, data, {
                headers: headers
            }
        );
    }
}
