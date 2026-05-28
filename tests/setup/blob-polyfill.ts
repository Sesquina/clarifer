/**
 * tests/setup/blob-polyfill.ts
 * Polyfills Blob.prototype.stream for Node.js/jsdom environments where it is
 * absent. Fixes "object.stream is not a function" in vitest PDF export tests.
 * Tables: None
 * Auth: Public
 * HIPAA: No PHI in this file
 */
import { Blob } from "node:buffer";

// Node.js strict-mode: cast to any to bridge DOM ReadableStream vs stream/web types.
// This file is test-only and never runs in production.
/* eslint-disable @typescript-eslint/no-explicit-any */
if (!(Blob.prototype as any).stream) {
  (Blob.prototype as any).stream = function (this: InstanceType<typeof Blob>): ReadableStream {
    const self = this;
    return new ReadableStream({
      start(controller: ReadableStreamDefaultController) {
        self.arrayBuffer().then((buf: ArrayBuffer) => {
          controller.enqueue(new Uint8Array(buf));
          controller.close();
        });
      },
    });
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
