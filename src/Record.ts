import Stream from "stream";

/**
 * Represents a record in an entry
 */
export class Record {
    public readonly time: bigint;
    public readonly size: bigint;
    public readonly stream: Stream;

    /**
     * Constructor which should be call from Bucket
     * @internal
     */
    public constructor(time: bigint, size: bigint, stream: Stream) {
        this.time = time;
        this.size = size;
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
}
