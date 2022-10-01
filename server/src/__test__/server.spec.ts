import test, { ExecutionContext } from "ava";

import * as spec from "../server";
import * as server from "./server";
import * as secure from "./secure";

const test200: ParametrizedTest = async (...args) => {
  await testServer(...args);
};

const test404: ParametrizedTest = async (...args) => {
  await testServer(...args, {
    regExp: /ungrouped-regexp-will-never-match/,
    expectedStatusCode: 404,
  });
};

const test204: ParametrizedTest = async (...args) => {
  await testServer(...args, 204);
};

const test403: ParametrizedTest = async (...args) => {
  await testServer(...args, 403);
};

test("Validate HTTP1 Node server works for 200", test200, 1, false);
test("Validate HTTP1 Node server works for 404", test404, 1, false);
test("Validate HTTP1 Node server works for 204", test204, 1, false);
test("Validate HTTP1 Node server works for 403", test403, 1, false);

test("Validate HTTP2 Node server works for 200", test200, 2, false);
test("Validate HTTP2 Node server works for 404", test404, 2, false);
test("Validate HTTP2 Node server works for 204", test204, 2, false);
test("Validate HTTP2 Node server works for 403", test403, 2, false);

test("Validate SSL HTTP1 Node server works for 200", test200, 1, true);
test("Validate SSL HTTP1 Node server works for 404", test404, 1, true);
test("Validate SSL HTTP1 Node server works for 204", test204, 1, true);
test("Validate SSL HTTP1 Node server works for 403", test403, 1, true);

test("Validate SSL HTTP2 Node server works for 200", test200, 2, true);
test("Validate SSL HTTP2 Node server works for 404", test404, 2, true);
test("Validate SSL HTTP2 Node server works for 204", test204, 2, true);
test("Validate SSL HTTP2 Node server works for 403", test403, 2, true);

const testServer = (
  t: ExecutionContext,
  httpVersion: spec.HTTPVersion,
  secure: boolean,
  info?: Parameters<typeof server.testServer>[2],
) =>
  server.testServer(
    t,
    (endpoints) =>
      httpVersion === 1
        ? secure
          ? spec.createServer({
              endpoints,
              options: {
                ...secureInfo,
              },
            })
          : spec.createServer({ endpoints })
        : secure
        ? {
            server: spec.createServer({
              endpoints,
              httpVersion,
              options: {
                ...secureInfo,
              },
            }),
            secure,
          }
        : {
            server: spec.createServer({
              endpoints,
              httpVersion,
            }),
            secure,
          },
    info,
  );

type ParametrizedTest = (
  t: ExecutionContext,
  httpVersion: spec.HTTPVersion,
  secure: boolean,
) => Promise<void>;

const secureInfo = secure.generateKeyAndCert();
