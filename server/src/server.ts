import type * as ep from "@ty-ras/endpoint";
import * as prefix from "@ty-ras/endpoint-prefix";
import * as server from "@ty-ras/server";

import * as http from "http";
import * as https from "https";
import * as http2 from "http2";
import * as stream from "stream";
import type * as tls from "tls";

export function createServer<TState>(
  opts: ServerCreationOptions<HTTP1ServerContext, TState, http.ServerOptions> &
    HTTP1ServerOptions,
): http.Server;
export function createServer<TState>(
  opts: ServerCreationOptions<HTTP1ServerContext, TState, https.ServerOptions> &
    HTTP1ServerOptions,
): https.Server;
export function createServer<TState>(
  opts: ServerCreationOptions<HTTP2ServerContext, TState, http2.ServerOptions> &
    HTTP2ServerOptions,
): http2.Http2Server;
export function createServer<TState>(
  opts: ServerCreationOptions<
    HTTP2ServerContext,
    TState,
    http2.SecureServerOptions
  > &
    HTTP2ServerOptions,
): http2.Http2SecureServer;
export function createServer<TState>(
  opts:
    | (ServerCreationOptions<HTTP1ServerContext, TState, http.ServerOptions> &
        HTTP1ServerOptions)
    | (ServerCreationOptions<HTTP1ServerContext, TState, https.ServerOptions> &
        HTTP1ServerOptions)
    | (ServerCreationOptions<HTTP2ServerContext, TState, http2.ServerOptions> &
        HTTP2ServerOptions)
    | (ServerCreationOptions<
        HTTP2ServerContext,
        TState,
        http2.SecureServerOptions
      > &
        HTTP2ServerOptions),
) {
  let retVal;
  if ("httpVersion" in opts && opts.httpVersion === 2) {
    const { endpoints, options, ...handlerOptions } = opts;
    const regExpAndHandler = prefix
      .atPrefix("", ...endpoints)
      .getRegExpAndHandler("");
    const httpHandler = asyncToVoid(
      createHandleHttpRequest<
        TState,
        http2.Http2ServerRequest,
        http2.Http2ServerResponse
      >(handlerOptions, regExpAndHandler),
    );
    if (
      options &&
      secureHttp1OptionKeys.some((propKey) => propKey in options)
    ) {
      retVal = http2.createServer(options, httpHandler);
    } else {
      retVal = http2.createSecureServer(options ?? {}, httpHandler);
    }
  } else {
    const { endpoints, options, ...handlerOptions } = opts;
    const regExpAndHandler = prefix
      .atPrefix("", ...endpoints)
      .getRegExpAndHandler("");
    const httpHandler = asyncToVoid(
      createHandleHttpRequest<
        TState,
        http.IncomingMessage,
        http.ServerResponse
      >(handlerOptions, regExpAndHandler),
    );
    if (
      options &&
      secureHttp2OptionKeys.some((propKey) => propKey in options)
    ) {
      retVal = https.createServer(options, httpHandler);
    } else {
      retVal = http.createServer(options ?? {}, httpHandler);
    }
  }
  return retVal;
}

export type HTTP1ServerOptions = {
  httpVersion?: 1;
};

export type HTTP2ServerOptions = {
  httpVersion: 2;
};

export type HTTP1ServerContext = Context<
  http.IncomingMessage,
  http.ServerResponse
>;

export type HTTP2ServerContext = Context<
  http2.Http2ServerRequest,
  http2.Http2ServerResponse
>;

export interface Context<TRequest, TResponse> {
  req: TRequest;
  res: TResponse;
}

export interface ServerCreationOptions<TContext, TState, TOPtions> {
  endpoints: Array<
    ep.AppEndpoint<TContext & { state: TState }, Record<string, unknown>>
  >;
  createState?: (context: TContext) => ep.MaybePromise<TState>;
  events?: server.ServerEventEmitter<TContext, TState>;
  options?: TOPtions;
  onStateCreationOrServerException?: (error: unknown) => void;
}

const secureHttp1OptionKeys: ReadonlyArray<keyof tls.TlsOptions> = [
  "key",
  "cert",
];
const secureHttp2OptionKeys: ReadonlyArray<
  "allowHTTP1" | "origins" | keyof tls.TlsOptions
> = ["allowHTTP1", "origins", ...secureHttp1OptionKeys];

const createHandleHttpRequest =
  <
    TState,
    TRequest extends http.IncomingMessage | http2.Http2ServerRequest,
    TResponse extends http.ServerResponse | http2.Http2ServerResponse,
  >(
    {
      createState,
      events,
      onStateCreationOrServerException,
    }: Pick<
      ServerCreationOptions<Context<TRequest, TResponse>, TState, never>,
      "createState" | "events" | "onStateCreationOrServerException"
    >,
    regExpAndHandler: {
      url: RegExp;
      handler: ep.DynamicHandlerGetter<
        Context<TRequest, TResponse> & {
          state: TState;
        }
      >;
    },
  ): ((req: TRequest, res: TResponse) => Promise<void>) =>
  async (req: TRequest, res: TResponse) => {
    try {
      const ctx = { req, res };
      // 1. Set up state
      const state = await createState?.(ctx);

      // 2. Perform flow
      await server.typicalServerFlow(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        { ...ctx, state: state as any },
        regExpAndHandler,
        events,
        {
          getURL: ({ req }) => req.url,
          getState: ({ state }) => state,
          getMethod: ({ req }) => req.method ?? "",
          getHeader: ({ req }, headerName) => req.headers[headerName],
          getRequestBody: ({ req }) => req,
          setHeader: ({ res }, headerName, headerValue) =>
            res.setHeader(headerName, headerValue),
          setStatusCode: ({ res }, statusCode) => {
            res.statusCode = statusCode;
          },
          sendContent: async ({ res }, content) => {
            if (content != undefined) {
              if (content instanceof stream.Readable) {
                await stream.promises.pipeline(content, res);
              } else {
                // We need to cast to Writable, as otherwise we will get compilation error:
                //  Each member of the union type [...] has signatures, but none of those signatures are compatible with each other.
                (res as stream.Writable).write(content);
              }
            }
          },
        },
      );
    } catch (error) {
      try {
        onStateCreationOrServerException?.(error);
      } catch {
        // Nothing we can do here anymore
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };

const asyncToVoid =
  <
    T extends (
      ...args: // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    ) => Promise<unknown>,
  >(
    asyncCallback: T,
  ): ((...args: Parameters<T>) => void) =>
  (...args) => {
    void asyncCallback(args);
  };
