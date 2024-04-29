// Example of using continuous query to subscribe to new records

const { Client } = require("../lib/cjs/index.js");

const client = new Client("http://127.0.0.1:8383");
const write = async () => {
  const bucket = await client.getOrCreateBucket("bucket");
  let good = true;
  for (let i = 0; i < 20; i++) {
    const timestamp = Date.now() * 1000;
    const record = await bucket.beginWrite("entry-1", {
      ts: timestamp,
      labels: { good: good ? "yes" : "no" },
      contentType: "text/plain",
    });
    good = !good;
    await record.write(`Message ${i}`);
    console.log(`Wrote message ${i}`);
  }
};

const read = async () => {
  const bucket = await client.getOrCreateBucket("bucket");
  const query = bucket.query("entry-1", undefined, undefined, {
    include: { good: "yes" },
    continuous: true,
  });
  let count = 0;
  for await (const record of query) {
    console.log(`Record timestamp: ${record.time}`);
    console.log(`Record size: ${record.size}`);
    console.log(`Record labels: ${JSON.stringify(record.labels)}`);
    console.log(`Record data: ${await record.readAsString()}`);

    if (count++ === 5) {
      break;
    }
  }
};

Promise.all([write(), read()]).then(() => console.log("done"));
