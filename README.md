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
const {Client} = require("../lib/cjs/index.js");

const client = new Client("http://127.0.0.1:8383");

const main = async () => {
    const bucket = await client.getOrCreateBucket("bucket");

    const timestamp = Date.now() * 1000;
    let record = await bucket.beginWrite("entry-1", timestamp);
    await record.write("Hello, World!");

    record = await bucket.beginRead("entry-1", timestamp);
    console.log((await record.read()).toString());
};

main()
    .then(() => console.log("done"))
    .catch((err) => console.error("oops: ", err));


```
