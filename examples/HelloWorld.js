const { Client } = require("../lib/cjs/index.js");

const client = new Client("http://127.0.0.1:8383", {
  verifySSL: false,
});

const main = async () => {
  const bucket = await client.getOrCreateBucket("bucket");

  const timestamp = BigInt(Date.now()) * 1000n;
  let record = await bucket.beginWrite("entry-1", timestamp);
  await record.write("Hello, World!");

  record = await bucket.beginRead("entry-1", timestamp);
  console.log(await record.readAsString());
};

main()
  .then(() => console.log("done"))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
