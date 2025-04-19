import { ReadableStream } from "node:stream/web";

Object.assign(globalThis, {
  ReadableStream,
});
