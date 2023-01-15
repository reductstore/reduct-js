# Quick Start

This quick start guide will walk you through the process of installing and using the ReductStore JavaScript client SDK to
interact with a [ReductStore](https://github.com/reductstore/reductstore) instance.

## Installing the SDK

To install the ReductStore SDK, you will need to have Node.js 16 or higher installed on your machine. Once Node.js is
installed, you can use the `npm` package manager to install the `reduct-js` package:

```
npm install reduct-js
```

## Running ReductStore as a Docker Container

If you don't already have a ReductStore instance running, you can easily spin one up as a Docker container. To do so,
run the following command:

```
docker run -p 8383:8383 reductstore/reductstore
```

This will start a ReductStore instance listening on port 8383 of your local machine.

## Using the SDK

Now that you have the `reduct-js` SDK installed and a ReductStore instance running, you can start using the SDK to
interact with the ReductStore instance.

Here is an example of using the Python SDK to perform a few different operations on a bucket:

```javascript title="QuickStart.js"
--8<-- "../examples/QuickStart.js"
```

Let's break down what this example is doing.

### Creating a Client

To start interacting with the database, we need to create a client. You can use the `Client` class from the `reduct` 
module. Pass the URL of the ReductStore instance you want to connect to as an argument to the `Client` constructor:

```javascript title="QuickStart.js"
--8<-- "../examples/QuickStart.js:createclient"
```
