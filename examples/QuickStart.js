const { Client, QuotaType } = require("../lib/cjs/index.js");

// 1. Create a ReductStore client
const client = new Client("http://127.0.0.1:8383", {
  apiToken: "my-token",
});

// 2. Get or create a bucket with 1Gb quota
const bucket = await client.getOrCreateBucket("my-bucket", {
  quotaType: QuotaType.FIFO,
  quotaSize: BigInt(1e9),
});

// 3. Write some data with timestamps in the 'sensor-1' entry
const us = (dateString) => BigInt(Date.parse(dateString) * 1000);
let record = await bucket.beginWrite("sensor-1", us("2021-01-01T00:00:00Z"));
await record.write("Record #1");
record = await bucket.beginWrite("sensor-1", us("2021-01-01T00:00:01Z"));
await record.write("Record #2");

// 4. Query the data by time range
for await (const record of bucket.query(
  "sensor-1",
  us("2021-01-01T00:00:00Z"),
  us("2021-01-01T00:00:02Z"),
)) {
  console.log(`Record timestamp: ${record.timestamp}`);
  console.log(`Record size: ${record.size}`);
  console.log(await record.readAsString());
}
