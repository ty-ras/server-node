import type * as http from "http";
import type * as http2 from "http2";
import type * as server from "@ty-ras/server";

export type ServerContext = HTTP1ServerContext | HTTP2ServerContext;

export type HTTP1ServerContext = ServerContextGeneric<
  http.IncomingMessage,
  http.ServerResponse
>;

export type HTTP2ServerContext = ServerContextGeneric<
  http2.Http2ServerRequest,
  http2.Http2ServerResponse
>;

export interface ServerContextGeneric<TRequest, TResponse> {
  req: TRequest;
  res: TResponse;
}

export type CreateStateGeneric<
  TStateInfo,
  TServerContext extends { req: unknown },
> = server.StateProvider<TServerContext["req"], TStateInfo>;

export type CreateState1<TStateInfo> = CreateStateGeneric<
  TStateInfo,
  HTTP1ServerContext
>;

export type CreateState2<TStateInfo> = CreateStateGeneric<
  TStateInfo,
  HTTP2ServerContext
>;

export type CreateState<TStateInfo> =
  | CreateState1<TStateInfo>
  | CreateState2<TStateInfo>;
