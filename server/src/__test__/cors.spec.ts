/**
 * @file This file contains unit tests for functionality in file `../cors.ts`.
 */

import test from "ava";
import * as spec from "../cors";

test("Validate that calling CORS callbacks does not crash", (c) => {
  // Not much else we can do since CORS callbacks are just call-thru to @ty-ras/server functionality
  c.plan(1);
  c.notThrows(() => {
    // We assign it to variable to avoid error where createCORSHandler accidentally does not return.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dummy = spec.createCORSHandler({ allowOrigin: "*" });
  });
});
