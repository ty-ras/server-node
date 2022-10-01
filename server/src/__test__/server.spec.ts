import test, { ExecutionContext } from "ava";

import * as spec from "../server";
import * as server from "./server";

const happyPath: ParametrizedTest = async (t, httpVersion) => {
  await testServer(t, httpVersion);
};

const test404: ParametrizedTest = async (t, httpVersion) => {
  await testServer(t, httpVersion, {
    regExp: /ungrouped-regexp-will-never-match/,
    expectedStatusCode: 404,
  });
};

const test204: ParametrizedTest = async (t, httpVersion) => {
  await testServer(t, httpVersion, 204);
};

const test403: ParametrizedTest = async (t, httpVersion) => {
  await testServer(t, httpVersion, 403);
};

test("Validate HTTP1 Node server works for happy path", happyPath, 1);
test("Validate HTTP1 Node server works for 404", test404, 1);
test("Validate HTTP1 Node server works for 204", test204, 1);
test("Validate HTTP1 Node server works for 403", test403, 1);

test("Validate HTTP2 Node server works for happy path", happyPath, 2);
test("Validate HTTP2 Node server works for 404", test404, 2);
test("Validate HTTP2 Node server works for 204", test204, 2);
test("Validate HTTP2 Node server works for 403", test403, 2);

const testServer = (
  t: ExecutionContext,
  httpVersion: spec.HTTPVersion,
  info?: Parameters<typeof server.testServer>[2],
) =>
  server.testServer(
    t,
    (endpoints) =>
      httpVersion === 1
        ? spec.createServer({
            endpoints,
          })
        : spec.createServer({
            endpoints,
            httpVersion,
          }),
    info,
  );

type ParametrizedTest = (
  t: ExecutionContext,
  httpVersion: spec.HTTPVersion,
) => Promise<void>;
