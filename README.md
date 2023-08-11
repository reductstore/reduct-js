# ReductStore Client SDK for JavaScript

[![npm](https://img.shields.io/npm/v/reduct-js)](https://www.npmjs.com/package/reduct-js)
[![npm](https://img.shields.io/npm/dm/reduct-js)](https://www.npmjs.com/package/reduct-js)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/reductstore/reduct-js/ci.yml?branch=main)](https://github.com/reductstore/reduct-js/actions)

The ReductStore Client SDK for JavaScript is an asynchronous HTTP client for interacting with
a [ReductStore](https://www.reduct-store) instance
from a JavaScript application. It is written in TypeScript and provides a set of APIs for accessing and manipulating
data stored in ReductStore.

## Features

* Promise-based API for easy asynchronous programming
* Support for ReductStore API version 1.6
* Token-based authentication for secure access to the database
* Labeling for read-write operations and querying

## Getting Started

To get started with the ReductStore Client SDK for JavaScript, you'll need to have ReductStore installed and running on
your machine. You can find instructions for installing ReductStore [here](https://docs.reduct-store/#start-with-docker).

Once you have ReductStore up and running, you can install the ReductStore Client SDK for JavaScript using npm:

```
npm i reduct-js
```

Then, you can use the following example code to start interacting with your ReductStore database from your JavaScript
application:

```js
const {Client} = require("reduct-js");

const client = new Client("http://127.0.0.1:8383");

const main = async () => {
    // Get or create a bucket in the database
    const bucket = await client.getOrCreateBucket("bucket");

    // Write a record to the bucket
    const timestamp = Date.now() * 1000;
    let record = await bucket.beginWrite("entry-1", timestamp);
    await record.write("Hello, World!");

    // Read the record back from the bucket
    record = await bucket.beginRead("entry-1", timestamp);
    console.log((await record.read()).toString());
};

main()
    .then(() => console.log("done"))
    .catch((err) => console.error("oops: ", err));
```

For more examples, see the [Quick Start](https://js.reduct.store/en/latest/docs/quick-start/).

## References

* [Documentation](https://js.reduct.store/)
* [ReductStore HTTP API](https://docs.reduct.store/http-api)
