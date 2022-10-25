/* c8 ignore next 13 */
import * as server from "@ty-ras/server";
import * as internal from "./internal";

export const createCORSHandler = (
  ...parameters: ParametersExceptFirst<typeof server.createCORSHandlerGeneric>
) =>
  server.createCORSHandlerGeneric<internal.ServerContextGenericHTTP1Or2>(
    internal.staticCallbacks,
    ...parameters,
  );

// From https://stackoverflow.com/questions/67605122/obtain-a-slice-of-a-typescript-parameters-tuple
// Let's go with this simple type and not venture into fragile world of generic case of slicing types from tuple types
export type ParametersExceptFirst<F> = F extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg0: any,
  ...rest: infer R
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
any
  ? R
  : never;
