/**
 * @file This file contains helper function to create Node server callback.
 */

import * as server from "@ty-ras/server";
import type * as context from "./context.types";
import * as internal from "./internal";

import type * as http from "node:http";
import type * as http2 from "node:http2";

/**
 * Creates a new {@link koa.Middleware} to serve the given TyRAS {@link ep.AppEndpoint}s.
 * @param endpoints The TyRAS {@link ep.AppEndpoint}s to serve through this Koa middleware.
 * @param createState The optional callback to create state for the endpoints.
 * @param events The optional {@link server.ServerEventHandler} callback to observe server events.
 * @returns The Koa middleware which will serve the given endpoints.
 */
export const createMiddleware = <TStateInfo, TState>(
  endpoints: server.ServerEndpoints<context.ServerContext, TStateInfo>,
  createState?: context.CreateState<TStateInfo>,
  events?: server.ServerEventHandler<
    server.GetContext<context.ServerContext>,
    TState
  >,
): server.HTTP1Handler | server.HTTP2Handler => {
  const flow = server.createTypicalServerFlow<
    context.ServerContext,
    TStateInfo,
    TState
  >(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    endpoints as any,
    {
      ...internal.staticCallbacks,
      getState: async ({ req }, stateInfo) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        await createState?.({ context: req as any, stateInfo }),
    },
    events,
  );
  return async (
    req: http.IncomingMessage | http2.Http2ServerRequest,
    res: http.ServerResponse | http2.Http2ServerResponse,
  ) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const ctx: context.ServerContext = {
        req,
        res,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      // Perform flow (typicalServerFlow is no-throw (as much as there can be one in JS) function)
      await flow(ctx);
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };
};
