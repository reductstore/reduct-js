const {Client, QuotaType} = require("../lib/cjs/index.js");
const fs = require("fs");

const main = async () => {
    // --8<-- [start:createclient]
    // Create a client
    const client = new Client("http://127.0.0.1:8383");
    // --8<-- [end:createclient]

    // Get or create a bucket with 1Gb quotan
    const bucket = await client.getOrCreateBucket("my-bucket",
        {quotaType: QuotaType.FIFO, quotaSize: BigInt(1e9)}
    );

    // The simplest case. Write some data with the current timestamp
    let record = await bucket.beginWrite("entry");
    await record.write("Hello, world!");

    // More complex case. Upload a file as a stream with a custom timestamp unix timestamp in microseconds
    const timestamp = Date.now() * 1000;
    record = await bucket.beginWrite("entry", timestamp);
    const fileStream = await fs.createReadStream(__filename);   // let's upload this file
    await record.write(fileStream, fs.statSync(__filename).size);

    // The simplest case. Read the data by a certain ts
    record = await bucket.beginRead("entry", timestamp);
    console.log(await record.readAsString());

    
    // More complex case. Iterate over all records in the entry and read them as steams
    function streamToString (stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on("error", (err) => reject(err));
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        });
    }
    
    for await (const record of bucket.query("entry")) {
        console.log(`Record timestamp: ${record.timestamp}`);
        console.log(`Record size: ${record.size}`);

        // Read the record as a stream
        await streamToString(record.stream);
    }

};

main().catch(e => console.error(e));