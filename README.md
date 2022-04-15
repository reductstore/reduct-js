# Reduct Storage Client SDK for JavaScript

Asynchronous HTTP client for [Reduct Storage](https://reduct-storage.dev) written in TypeScript.

## Features

* Promise based
* Support Reduct Storage API v0.4
* Token authentication

## Getting Started

Read [here](https://docs.reduct-storage.dev/#start-with-docker), how to run Reduct Storage. 
Then install the package:

```
npm i reduct-js
```

And run this example:

```js
const {Client} = require("reduct-js")

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

```
