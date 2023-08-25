/**
 * @file This file contains unit tests for functionality in file `../listen.ts`.
 */

import test from "ava";

import getPort from "@ava/get-port";
import * as spec from "../listen";
import * as server from "../server";

test("Verify that listen overload for host and port as in starter template, works", async (c) => {
  c.plan(1);
  await c.notThrowsAsync(
    async () =>
      await spec.listenAsync(
        server.createServer({ endpoints: [] }),
        "localhost",
        await getPort(),
      ),
  );
});

test("Verify that listen overload for listen options works", async (c) => {
  c.plan(1);
  await c.notThrowsAsync(
    async () =>
      await spec.listenAsync(server.createServer({ endpoints: [] }), {
        host: "localhost",
        port: await getPort(),
      }),
  );
});
