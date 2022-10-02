import Stream from "stream";
// @ts-ignore`
import {AxiosInstance} from "axios";

/**
 * Represents a record in an entry for reading
 */
export class ReadableRecord {
    public readonly time: bigint;
    public readonly size: bigint;
    public readonly last: boolean;
    public readonly stream: Stream;

    /**
     * Constructor which should be call from Bucket
     * @internal
     */
    public constructor(time: bigint, size: bigint, last: boolean, stream: Stream) {
        this.time = time;
        this.size = size;
        this.last = last;
        this.stream = stream;
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

    /**
     * Constructor for stream
     * @internal
     */
    public constructor(bucketName: string, entryName: string, time: bigint, httpClient: AxiosInstance) {
        this.bucketName = bucketName;
        this.entryName = entryName;
        this.time = time;
        this.httpClient = httpClient;
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

        const {bucketName, entryName, time} = this;
        await this.httpClient.post(`/b/${bucketName}/${entryName}?ts=${time}`, data, {
                headers: {"content-length": contentLength.toString()}
            }
        );
    }
}
