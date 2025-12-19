# ReductStore Client SDK for JavaScript

[![npm](https://img.shields.io/npm/v/reduct-js)](https://www.npmjs.com/package/reduct-js)
[![npm](https://img.shields.io/npm/dm/reduct-js)](https://www.npmjs.com/package/reduct-js)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/reductstore/reduct-js/ci.yml?branch=main)](https://github.com/reductstore/reduct-js/actions)

The ReductStore Client SDK for JavaScript is an asynchronous HTTP client for interacting with
a [ReductStore](https://www.reduct.store) instance from a JavaScript application. It is written in TypeScript and provides a set of APIs for accessing and manipulating
data stored in ReductStore.

## Requirements

- Node.js 18 or later
- TypeScript 4.6 or later

## Features

- Based on the Fetch API
- Promise-based API for easy asynchronous programming
- Support for [ReductStore HTTP API v1.18](https://www.reduct.store/docs/http-api)
- Token-based authentication for secure access to the database
- Labeling for read-write operations and querying
- Batch operations for efficient data processing

## Getting Started

To get started with the ReductStore Client SDK for JavaScript, you'll need to have ReductStore installed and running on
your machine. You can find instructions for installing ReductStore [here](https://www.reduct.store/docs/getting-started#docker).

Once you have ReductStore up and running, you can install the ReductStore Client SDK for JavaScript using npm:

```
npm i reduct-js
```

Then, you can use the following example code to start interacting with your ReductStore database from your JavaScript
application:

```js
const { Client, QuotaType } = require("reduct-js");

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
```

For more examples, see the [Guides](https://www.reduct.store/docs/guides) section in the ReductStore documentation.

## JavaScript Limitations

- The SDK doesn't support steaming data to the server in JavaScript. The `WriteableRecord.write` method
  is not implemented and will throw a Fetch error.

## Supported ReductStore Versions and Backward Compatibility

The library is backward compatible with the previous versions. However, some methods have been deprecated and will be
removed in the future releases. Please refer to the [Changelog](CHANGELOG.md) for more details.
The SDK supports the following ReductStore API versions:

- v1.18
- v1.17
- v1.16

It can work with newer and older versions, but it is not guaranteed that all features will work as expected because
the API may change and some features may be deprecated or the SDK may not support them yet.
