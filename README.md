# Reduct Storage Client SDK for JavaScript

Asynchronous HTTP client for [Reduct Storage](https://reduct-storage.dev) written in TypeScript.

## Features

* Promise based
* Support Reduct Storage API v0.4

## Example

```js
const {Client} = require("reduct-js")

const main = async () => {
  const client = new Client("http://127.0.0.1:8383");
  
  client.createBucket("bucket").then(async (bucket) => {
    const timestamp = Date.now() * 1000;
    await bucket.write("entry-1", "Hello, World!", timestamp);
    console.log(await bucket.read("entry-1", timestamp));
  });
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.error("oups: ", err));

```
