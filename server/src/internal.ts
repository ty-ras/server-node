import type * as server from "@ty-ras/server";
import type * as ctx from "./context";
import type * as http from "http";
import type * as http2 from "http2";
import * as stream from "stream";

export const staticCallbacks: server.ServerFlowCallbacksWithoutState<ServerContextGenericHTTP1Or2> =
  {
    getURL: ({ req }) => req.url,
    getMethod: ({ req }) => req.method ?? "",
    getHeader: ({ req }, headerName) => req.headers[headerName],
    getRequestBody: ({ req }) => req,
    setHeader: ({ res }, headerName, headerValue) =>
      res.setHeader(headerName, headerValue),
    setStatusCode: ({ res }, statusCode) => (res.statusCode = statusCode),
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
  };

export type ServerContextGenericHTTP1Or2 = ctx.ServerContextGeneric<
  http.IncomingMessage | http2.Http2ServerRequest,
  http.ServerResponse | http2.Http2ServerResponse
>;
