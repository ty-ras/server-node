import * as ep from "@ty-ras/endpoint";
import * as prefix from "@ty-ras/endpoint-prefix";
import * as server from "@ty-ras/server";

import type * as ctx from "./context";
import * as internal from "./internal";

import * as http from "http";
import * as https from "https";
import * as http2 from "http2";
import type * as tls from "tls";

export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP1ServerContext,
    TStateInfo,
    TState,
    http.ServerOptions,
    false
  > &
    HTTP1ServerOptions,
): http.Server;
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP1ServerContext,
    TStateInfo,
    TState,
    https.ServerOptions,
    true
  > &
    HTTP1ServerOptions,
): https.Server;
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP2ServerContext,
    TStateInfo,
    TState,
    http2.ServerOptions,
    false
  > &
    HTTP2ServerOptions,
): http2.Http2Server;
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP2ServerContext,
    TStateInfo,
    TState,
    http2.SecureServerOptions,
    true
  > &
    HTTP2ServerOptions,
): http2.Http2SecureServer;
export function createServer<TStateInfo, TState>(
  opts:
    | (ServerCreationOptions<
        ctx.HTTP1ServerContext,
        TStateInfo,
        TState,
        http.ServerOptions,
        false
      > &
        HTTP1ServerOptions)
    | (ServerCreationOptions<
        ctx.HTTP1ServerContext,
        TStateInfo,
        TState,
        https.ServerOptions,
        true
      > &
        HTTP1ServerOptions)
    | (ServerCreationOptions<
        ctx.HTTP2ServerContext,
        TStateInfo,
        TState,
        http2.ServerOptions,
        false
      > &
        HTTP2ServerOptions)
    | (ServerCreationOptions<
        ctx.HTTP2ServerContext,
        TStateInfo,
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
        TStateInfo,
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
        TStateInfo,
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
  TServerContext extends { req: unknown },
  TStateInfo,
  TState,
  TOPtions,
  TSecure extends boolean,
> {
  endpoints: ReadonlyArray<ep.AppEndpoint<TServerContext, TStateInfo>>;
  createState?: ctx.CreateStateGeneric<TStateInfo, TServerContext> | undefined;
  events?:
    | server.ServerEventEmitter<server.GetContext<TServerContext>, TState>
    | undefined;
  options?: TOPtions | undefined;
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

const createHandleHttpRequest = <
  TStateInfo,
  TState,
  TRequest extends http.IncomingMessage | http2.Http2ServerRequest,
  TResponse extends http.ServerResponse | http2.Http2ServerResponse,
>(
  {
    createState,
    events,
  }: Pick<
    ServerCreationOptions<
      ctx.ServerContextGeneric<TRequest, TResponse>,
      TStateInfo,
      TState,
      never,
      never
    >,
    "createState" | "events"
  >,
  regExpAndHandler: ep.FinalizedAppEndpoint<
    ctx.ServerContextGeneric<TRequest, TResponse>,
    TStateInfo
  >,
): HTTP1Or2Handler<TRequest, TResponse> => {
  const flow = server.createTypicalServerFlow(
    regExpAndHandler,
    {
      ...internal.staticCallbacks,
      getState: async ({ req }, stateInfo) =>
        await createState?.({ context: req, stateInfo }),
    },
    events,
  );
  return async (req: TRequest, res: TResponse) => {
    try {
      const ctx: ctx.ServerContextGeneric<TRequest, TResponse> = {
        req,
        res,
      };
      // Perform flow (typicalServerFlow is no-throw (as much as there can be one in JS) function)
      await flow(ctx);
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };
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

const getRegExpAndHandler = <TContext, TStateInfo>(
  endpoints: ReadonlyArray<ep.AppEndpoint<TContext, TStateInfo>>,
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
