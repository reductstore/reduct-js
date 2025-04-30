import { Blob } from "buffer";
import { ReadableStream as NodeReadableStream } from "stream/web";
import { TextEncoder, TextDecoder } from "util";

// Patch globalThis BEFORE importing undici
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

if (typeof globalThis.Blob === "undefined") {
  globalThis.Blob = Blob as typeof globalThis.Blob;
}

if (typeof globalThis.ReadableStream === "undefined") {
  globalThis.ReadableStream =
    NodeReadableStream as typeof globalThis.ReadableStream;
}

// THEN: import undici
import { fetch as undiciFetch } from "undici";

// polyfill fetch if missing
if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = undiciFetch as unknown as typeof globalThis.fetch;
}
