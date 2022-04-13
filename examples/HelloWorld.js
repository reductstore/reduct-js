const {Client} = require("../lib/cjs/index.js");

const main = async () => {
  const client = new Client("http://127.0.0.1:8383");

  const bucket = await client.createBucket("bucket");
  
  const timestamp = Date.now() * 1000;
  await bucket.write("entry-1", "Hello, World!", timestamp);
  console.log(await bucket.read("entry-1", timestamp));
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.error("oops: ", err));
