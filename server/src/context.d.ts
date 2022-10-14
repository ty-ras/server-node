import type * as http from "http";
import type * as http2 from "http2";
import type * as ep from "@ty-ras/endpoint";

export type Context<TState> = Context1<TState> | Context2<TState>;
export type ServerContext = HTTP1ServerContext | HTTP2ServerContext;

export type ContextGeneric<TServerContext, TState> = TServerContext & {
  state: TState;
};

export type Context1<TState> = ContextGeneric<HTTP1ServerContext, TState>;
export type Context2<TState> = ContextGeneric<HTTP2ServerContext, TState>;

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
> = StateProvider<TServerContext["req"], TStateInfo>;

export type CreateState1<TStateInfo> = CreateStateGeneric<
  TStateInfo,
  HTTP1ServerContext
>;

export type CreateState2<TStateInfo> = CreateStateGeneric<
  TStateInfo,
  HTTP2ServerContext
>;

export type CreateState<TStateInfo> = CreateStateGeneric<
  TStateInfo,
  HTTP1ServerContext | HTTP2ServerContext
>;

export type StateProvider<TContext, TStateInfo> = (args: {
  context: TContext;
  stateInfo: TStateInfo;
}) => ep.MaybePromise<unknown>;
