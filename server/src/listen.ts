/**
 * @file This file contains function that can be used to expose uniform way to listen to TyRAS servers.
 */

import * as net from "node:net";
import type * as server from "./server";
import * as serverGeneric from "@ty-ras/server";

/**
 * The helper function to listen to given {@link server.HttpServer} asynchronously.
 * @param server The {@link server.HttpServer} to listen to.
 * @param host The hostname as string.
 * @param port The port as number.
 * @param backlog The backlog parameter, if any.
 * @returns Asynchronously nothing.
 */
export function listenAsync(
  server: server.HttpServer,
  host: string,
  port: number,
  backlog?: number,
): Promise<void>;

/**
 *The helper function to listen to given {@link server.HttpServer} asynchronously.
 * @param server The {@link server.HttpServer} to listen to.
 * @param options The options for listening.
 * @returns Asynchronously nothing.
 */
export function listenAsync(
  server: server.HttpServer,
  options: net.ListenOptions,
): Promise<void>;

/**
 * The helper function to listen to given {@link server.HttpServer} asynchronously.
 * @param server The {@link server.HttpServer} to listen to.
 * @param hostOrOptions The {@link net.ListenOptions}.
 * @param port The port to listen to.
 * @param backlog The backlog parameter, if any.
 * @returns Asynchronously nothing.
 */
export function listenAsync(
  server: server.HttpServer,
  hostOrOptions: string | net.ListenOptions,
  port?: number,
  backlog?: number,
) {
  return serverGeneric.listenAsyncGeneric(server, hostOrOptions, port, backlog);
}
