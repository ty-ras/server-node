/**
 * @file This types-only file refines generic TyRAS server-related types to Node server -specific types.
 */

import type * as http from "node:http";
import type * as http2 from "node:http2";
import type * as server from "@ty-ras/server";

/**
 * This is server context type for Node HTTP1 or HTTP2 server.
 * @see HTTP1ServerContext
 * @see HTTP2ServerContext
 */
export type ServerContext = HTTP1ServerContext | HTTP2ServerContext;

/**
 * This type is server context type for Node HTTP1 server.
 * @see ServerContextGeneric
 */
export type HTTP1ServerContext = ServerContextGeneric<
  http.IncomingMessage,
  http.ServerResponse
>;

/**
 * This type is server context type for Node HTTP2 server.
 * @see ServerContextGeneric
 */
export type HTTP2ServerContext = ServerContextGeneric<
  http2.Http2ServerRequest,
  http2.Http2ServerResponse
>;

/**
 * This interface is generic, parametrizable, server context type for Node HTTP server (1 or 2).
 */
export interface ServerContextGeneric<TRequest, TResponse> {
  /**
   * The HTTP request being processed.
   */
  req: TRequest;

  /**
   * The HTTP response to be sent to client.
   */
  res: TResponse;
}

/**
 * This is type for callbacks which create endpoint-specific state when processing requests in Node HTTP1 or HTTP2 server.
 * @see HTTP1CreateState
 * @see HTTP2CreateState
 */
export type CreateState<TStateInfo> =
  | HTTP1CreateState<TStateInfo>
  | HTTP2CreateState<TStateInfo>;

/**
 * This is type for callbacks which create endpoint-specific state when processing requests in Node HTTP1 server.
 */
export type HTTP1CreateState<TStateInfo> = CreateStateGeneric<
  TStateInfo,
  HTTP1ServerContext
>;

/**
 * This is type for callbacks which create endpoint-specific state when processing requests in Node HTTP2 server.
 */
export type HTTP2CreateState<TStateInfo> = CreateStateGeneric<
  TStateInfo,
  HTTP2ServerContext
>;

/**
 * This is generic, parametrizable, type for callbacks which create endpoint-specific state when processing requests in Node HTTP server (1 or 2).
 */
export type CreateStateGeneric<
  TStateInfo,
  TServerContext extends { req: unknown },
> = server.StateProvider<TServerContext["req"], TStateInfo>;
