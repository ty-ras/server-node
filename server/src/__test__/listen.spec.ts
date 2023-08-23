/**
 * @file This file contains unit tests for functionality in file `../listen.ts`.
 */

import test from "ava";

import getPort from "@ava/get-port";
import * as spec from "../listen";
import * as server from "../server";

test("Validate that listening to server does not crash", async (c) => {
  // Not much else we can do since CORS callbacks are just call-thru to @ty-ras/server functionality
  c.plan(1);
  await c.notThrowsAsync(async () => {
    await spec.listenAsync(
      server.createServer({ endpoints: [] }),
      "localhost",
      await getPort(),
    );
  });
});
