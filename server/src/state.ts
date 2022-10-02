import type * as server from "@ty-ras/server";
import type * as ep from "@ty-ras/endpoint";
import type * as context from "./context";

export const getStateFromContext: server.GetStateFromContext<
  context.HKTContext
> = (ctx) => ctx.state;

export type CreateState<TContext, TState> = (
  context: TContext,
) => ep.MaybePromise<TState>;
