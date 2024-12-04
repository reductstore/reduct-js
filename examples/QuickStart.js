const { Client, QuotaType } = require("../lib/cjs/index.js");

const main = async () => {
  // 1. Create a ReductStore client
  const client = new Client("http://127.0.0.1:8383", {
    apiToken: "my-token",
  });

  // 2. Get or create a bucket with 1Gb quota
  const bucket = await client.getOrCreateBucket("my-bucket", {
    quotaType: QuotaType.FIFO,
    quotaSize: BigInt(1e9),
  });

  // 3. Write some data with timestamps and labels to the 'entry-1' entry
  const us = (dateString) => BigInt(Date.parse(dateString) * 1000);
  let record = await bucket.beginWrite("sensor-1", {
    ts: us("2021-01-01T11:00:00Z"),
    labels: {
      score: 10,
    },
  });

  await record.write("<Blob data>");
  record = await bucket.beginWrite("sensor-1", {
    ts: us("2021-01-01T11:00:01Z"),
    labels: {
      score: 20,
    },
  });
  await record.write("<Blob data>");

  // 4. Query the data by time range and condition
  for await (const record of bucket.query(
    "sensor-1",
    us("2021-01-01T11:00:00Z"),
    us("2021-01-01T11:00:02Z"),
    {
      when: { "&score": { $gt: 10 } },
    },
  )) {
    console.log(`Record timestamp: ${record.time}`);
    console.log(`Record size: ${record.size}`);
    console.log(await record.readAsString());
  }
};

main().then(() => console.log("done"));
