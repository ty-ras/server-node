import test from "ava";

import * as spec from "../server";
import * as secure from "./secure";

import * as testSupport from "@ty-ras/server-test-support";
import type * as ctx from "../context";

const createServer: testSupport.CreateServer = (
  endpoints,
  info,
  httpVersion,
  secure,
) =>
  httpVersion === 1
    ? secure
      ? spec.createServer({
          endpoints,
          ...getCreateState(info),
          options: {
            ...secureInfo,
          },
        })
      : spec.createServer({ endpoints, ...getCreateState(info) })
    : httpVersion === 2
    ? secure
      ? {
          server: spec.createServer({
            endpoints,
            ...getCreateState(info),
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
            ...getCreateState(info),
            httpVersion,
          }),
          secure,
        }
    : doThrow(`Invalid http version: ${httpVersion}`);

const secureInfo = secure.generateKeyAndCert();
const doThrow = (msg: string) => {
  throw new Error(msg);
};

const defaultOpts: testSupport.RegisterTestsOptions = {
  run500Test: true,
};

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 1,
  secure: false,
});

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 1,
  secure: true,
});

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 2,
  secure: false,
});

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 2,
  secure: true,
});

const getCreateState = (
  info: testSupport.ServerTestAdditionalInfo[0],
): Pick<
  spec.ServerCreationOptions<ctx.ServerContext, unknown, never, never, never>,
  "createState" | "onServerException"
> =>
  info == 500
    ? {
        createState: () => {
          throw new Error("This should be catched.");
        },
        onServerException: () => {
          throw new Error("This should be catched as well.");
        },
      }
    : {};
