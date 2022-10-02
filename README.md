# Reduct Storage Client SDK for JavaScript

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/reduct-storage/reduct-js)
![npm](https://img.shields.io/npm/dm/reduct-js)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/reduct-storage/reduct-js/ci)

Asynchronous HTTP client for [Reduct Storage](https://reduct-storage.dev) written in TypeScript.

## Features

* Promise based
* Support Reduct Storage API v1.0
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
  const client = new Client("https://play.reduct-storage.dev", {apiToken: "reduct"});

  const bucket = await client.getOrCreateBucket("bucket");

  const timestamp = Date.now() * 1000;
  await bucket.write("entry-1", "Hello, World!", timestamp);
  console.log(await bucket.read("entry-1", timestamp));
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.error("oops: ", err));

```
