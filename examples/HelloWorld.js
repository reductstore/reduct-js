const { Client } = require("../lib/cjs/index.js");

const client = new Client("http://127.0.0.1:8383", {
  verifySSL: false,
});

const main = async () => {
  const bucket = await client.getOrCreateBucket("bucket");

  const timestamp = Date.now() * 1000;
  let record = await bucket.beginWrite("entry-1", BigInt.valueOf(timestamp));
  await record.write("Hello, World!");

  record = await bucket.beginRead("entry-1", timestamp);
  console.log(await record.readAsString());
};

main().then(() => console.log("done"));
