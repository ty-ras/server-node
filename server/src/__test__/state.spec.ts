import test from "ava";
import * as spec from "../state";

test("Validate that getStateFromContext works", (t) => {
  t.plan(1);
  t.deepEqual(spec.getStateFromContext({ state: "State" }), "State");
});
