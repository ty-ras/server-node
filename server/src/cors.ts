/**
 * @file This file contains code which exposes Node server -specific CORS handler creation function.
 */
/* c8 ignore next 13 */
import * as server from "@ty-ras/server";
import * as internal from "./internal";

/**
 * Creates new CORS handler to be used for Node servers with given options.
 * @param parameters The parameters for CORS handler
 * @returns The {@link server.EventHandler} that can be used to handle CORS functionality via server events.
 * @see server.createCORSHandlerGeneric
 */
export const createCORSHandler = (
  ...parameters: ParametersExceptFirst<typeof server.createCORSHandlerGeneric>
) =>
  server.createCORSHandlerGeneric<internal.ServerContextGenericHTTP1Or2>(
    internal.staticCallbacks,
    ...parameters,
  );

/**
 * This is helper type to extract all parameters from given function, except first one.
 * Adopted from [StackOverflow](https://stackoverflow.com/questions/67605122/obtain-a-slice-of-a-typescript-parameters-tuple).
 * Let's go with this simple type for now and not venture into fragile world of generic case of slicing types from tuple types
 */
export type ParametersExceptFirst<F> = F extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg0: any,
  ...rest: infer R
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
any
  ? R
  : never;
