/**
 * @file This file exposes function to create Node HTTP 1 or 2 server serving giving TyRAS {@link ep.AppEndpoint}s.
 */

import * as server from "@ty-ras/server";

import type * as ctx from "./context.types";
import * as middleware from "./middleware";

import * as http from "node:http";
import * as https from "node:https";
import * as http2 from "node:http2";

/**
 * Creates new non-secure HTTP1 {@link http.Server} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new non-secure HTTP1 {@link http.Server}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<ctx.HTTP1ServerContext, TStateInfo, TState> &
    server.NodeServerOptions1<false>,
): http.Server;

/**
 * Creates new secure HTTP1 {@link https.Server} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new secure HTTP1 {@link https.Server}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<ctx.HTTP1ServerContext, TStateInfo, TState> &
    server.NodeServerOptions1<true>,
): https.Server;

/**
 * Creates new non-secure HTTP2 {@link http2.Http2Server} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to use HTTP2 protocol.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new non-secure HTTP2 {@link http2.Http2Server}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<ctx.HTTP2ServerContext, TStateInfo, TState> &
    server.NodeServerOptions2<false>,
): http2.Http2Server;

/**
 * Creates new secure HTTP2 {@link http2.Http2SecureServer} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to use HTTP2 protocol.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new secure HTTP2 {@link http2.Http2SecureServer}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<ctx.HTTP2ServerContext, TStateInfo, TState> &
    server.NodeServerOptions2<true>,
): http2.Http2SecureServer;

/**
 * Creates new secure or non-secure HTTP1 or HTTP2 Node server serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to enable HTTP2 protocol, otherwise HTTP1 server will be returned.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @param opts.endpoints Privately deconstructed variable.
 * @param opts.createState Privately deconstructed variable.
 * @param opts.events Privately deconstructed variable.
 * @param opts.options Privately deconstructed variable.
 * @returns Secure or non-secure HTTP1 or HTTP2 Node server
 */
export function createServer<TStateInfo, TState>({
  endpoints,
  createState,
  events,
  ...options
}:
  | (ServerCreationOptions<ctx.HTTP1ServerContext, TStateInfo, TState> &
      server.NodeServerOptions1<false>)
  | (ServerCreationOptions<ctx.HTTP1ServerContext, TStateInfo, TState> &
      server.NodeServerOptions1<true>)
  | (ServerCreationOptions<ctx.HTTP2ServerContext, TStateInfo, TState> &
      server.NodeServerOptions2<false>)
  | (ServerCreationOptions<ctx.HTTP2ServerContext, TStateInfo, TState> &
      server.NodeServerOptions2<true>)): HttpServer {
  return server.createNodeServerGeneric(
    options,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    middleware.createMiddleware(endpoints as any, createState, events),
  );
}

/**
 * This interface contains options common for both HTTP 1 and 2 servers when creating them via {@link createServer}.
 */
export interface ServerCreationOptions<
  TServerContext extends { req: unknown },
  TStateInfo,
  TState,
> {
  /**
   * The TyRAS {@link ep.AppEndpoint}s to server via returned HTTP server.
   */
  endpoints: server.ServerEndpoints<TServerContext, TStateInfo>;

  /**
   * The callback to create endpoint-specific state objects.
   */
  createState?: ctx.CreateStateGeneric<TStateInfo, TServerContext> | undefined;

  /**
   * The callback for tracking events occurred within the server.
   */
  events?:
    | server.ServerEventHandler<server.GetContext<TServerContext>, TState>
    | undefined;
}

/**
 * This type contains all the HTTP server types that can be created with TyRAS backend for Node servers.
 */
export type HttpServer =
  | http.Server
  | https.Server
  | http2.Http2Server
  | http2.Http2SecureServer;

/**
 * Helper method to optionalize {@link server.NodeServerOptions1} and {@link server.NodeServerOptions2}.
 */
export type OptionalizeOptions<
  TType extends
    | server.NodeServerOptions1<boolean>
    | server.NodeServerOptions2<boolean>,
> = Omit<TType, "options"> & { options?: TType["options"] };
