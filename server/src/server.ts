import * as ep from "@ty-ras/endpoint";
import * as prefix from "@ty-ras/endpoint-prefix";
import * as server from "@ty-ras/server";

import type * as ctx from "./context";
import type * as state from "./state";

import * as http from "http";
import * as https from "https";
import * as http2 from "http2";
import * as stream from "stream";
import type * as tls from "tls";

export function createServer<TState>(
  opts: ServerCreationOptions<
    ctx.HTTP1ServerContext,
    TState,
    http.ServerOptions,
    false
  > &
    HTTP1ServerOptions,
): http.Server;
export function createServer<TState>(
  opts: ServerCreationOptions<
    ctx.HTTP1ServerContext,
    TState,
    https.ServerOptions,
    true
  > &
    HTTP1ServerOptions,
): https.Server;
export function createServer<TState>(
  opts: ServerCreationOptions<
    ctx.HTTP2ServerContext,
    TState,
    http2.ServerOptions,
    false
  > &
    HTTP2ServerOptions,
): http2.Http2Server;
export function createServer<TState>(
  opts: ServerCreationOptions<
    ctx.HTTP2ServerContext,
    TState,
    http2.SecureServerOptions,
    true
  > &
    HTTP2ServerOptions,
): http2.Http2SecureServer;
export function createServer<TState>(
  opts:
    | (ServerCreationOptions<
        ctx.HTTP1ServerContext,
        TState,
        http.ServerOptions,
        false
      > &
        HTTP1ServerOptions)
    | (ServerCreationOptions<
        ctx.HTTP1ServerContext,
        TState,
        https.ServerOptions,
        true
      > &
        HTTP1ServerOptions)
    | (ServerCreationOptions<
        ctx.HTTP2ServerContext,
        TState,
        http2.ServerOptions,
        false
      > &
        HTTP2ServerOptions)
    | (ServerCreationOptions<
        ctx.HTTP2ServerContext,
        TState,
        http2.SecureServerOptions,
        true
      > &
        HTTP2ServerOptions),
) {
  let retVal;
  if ("httpVersion" in opts && opts.httpVersion === 2) {
    const { endpoints, options, secure, ...handlerOptions } = opts;
    const httpHandler = asyncToVoid(
      createHandleHttpRequest<
        TState,
        http2.Http2ServerRequest,
        http2.Http2ServerResponse
      >(handlerOptions, getRegExpAndHandler(endpoints)),
    );
    if (isSecure(secure, options, 2)) {
      retVal = http2.createSecureServer(options ?? {}, httpHandler);
    } else {
      retVal = http2.createServer(options ?? {}, httpHandler);
    }
  } else {
    const { endpoints, options, secure, ...handlerOptions } = opts;
    const httpHandler = asyncToVoid(
      createHandleHttpRequest<
        TState,
        http.IncomingMessage,
        http.ServerResponse
      >(handlerOptions, getRegExpAndHandler(endpoints)),
    );
    if (isSecure(secure, options, 1)) {
      retVal = https.createServer(options ?? {}, httpHandler);
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

export type HTTPVersion = 1 | 2;

export interface ServerCreationOptions<
  TServerContext,
  TState,
  TOPtions,
  TSecure extends boolean,
> {
  endpoints: ReadonlyArray<
    ep.AppEndpoint<
      ctx.ContextGeneric<TServerContext, TState>,
      Record<string, unknown>
    >
  >;
  createState?: state.CreateState<TServerContext, TState> | undefined;
  events?: server.ServerEventEmitter<TServerContext, TState> | undefined;
  options?: TOPtions | undefined;
  onStateCreationOrServerException?: ((error: unknown) => void) | undefined;
  secure?: TSecure | undefined;
}

const secureHttp1OptionKeys: ReadonlyArray<keyof tls.TlsOptions> = [
  "key",
  "cert",
  "pfx",
  "passphrase",
  "rejectUnauthorized",
  "ciphers",
  "ca",
  "requestCert",
  "secureContext",
  "secureOptions",
  "secureProtocol",
  "sigalgs",
  "ticketKeys",
  "crl",
  "clientCertEngine",
  "dhparam",
  "ecdhCurve",
  "allowHalfOpen",
  "handshakeTimeout",
  "honorCipherOrder",
  "keepAlive",
  "keepAliveInitialDelay",
  "maxVersion",
  "minVersion",
  "noDelay",
  "pauseOnConnect",
  "privateKeyEngine",
  "privateKeyIdentifier",
  "pskCallback",
  "pskIdentityHint",
  "sessionIdContext",
  "sessionTimeout",
  "ALPNProtocols",
  "SNICallback",
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
      ServerCreationOptions<
        ctx.ServerContextGeneric<TRequest, TResponse>,
        TState,
        never,
        never
      >,
      "createState" | "events" | "onStateCreationOrServerException"
    >,
    regExpAndHandler: {
      url: RegExp;
      handler: ep.DynamicHandlerGetter<
        ctx.ServerContextGeneric<TRequest, TResponse> & {
          state: TState;
        }
      >;
    },
  ): HTTP1Or2Handler<TRequest, TResponse> =>
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
                const buffer =
                  typeof content === "string" ? Buffer.from(content) : content;
                res.setHeader("Content-Length", buffer.byteLength);
                // We need to cast to Writable, as otherwise we will get compilation error:
                //  Each member of the union type [...] has signatures, but none of those signatures are compatible with each other.
                (res as stream.Writable).write(buffer);
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
      res.statusCode = 500;
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };

type HTTP1Or2Handler<TRequest, TResponse> = (
  req: TRequest,
  res: TResponse,
) => Promise<void>;

const asyncToVoid =
  <TRequest, TResponse>(
    asyncCallback: HTTP1Or2Handler<TRequest, TResponse>,
  ): ((...args: Parameters<typeof asyncCallback>) => void) =>
  (...args) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    void asyncCallback(...args);
  };

const getRegExpAndHandler = <TContext>(
  endpoints: ReadonlyArray<ep.AppEndpoint<TContext, Record<string, unknown>>>,
) => prefix.atPrefix("", ...endpoints).getRegExpAndHandler("");

const isSecure = (
  secure: boolean | undefined,
  options: object | undefined,
  version: 1 | 2,
) =>
  secure ||
  (options &&
    (version === 1 ? secureHttp1OptionKeys : secureHttp2OptionKeys).some(
      (propKey) => propKey in options,
    ));
