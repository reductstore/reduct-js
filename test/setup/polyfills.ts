import { Blob } from "node:buffer";
import { ReadableStream } from "node:stream/web";

Object.assign(globalThis, {
  ReadableStream,
  Blob,
});
