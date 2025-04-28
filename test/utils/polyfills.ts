import fetch from "cross-fetch";
import { Blob } from "node:buffer";
import { ReadableStream } from "node:stream/web";
import { TextEncoder, TextDecoder } from "util";

Object.assign(globalThis, {
  fetch,
  TextEncoder,
  TextDecoder,
  Blob,
  ReadableStream,
});
