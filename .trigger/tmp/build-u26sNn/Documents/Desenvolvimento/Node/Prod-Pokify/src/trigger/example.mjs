import {
  logger,
  task,
  wait
} from "../../../../../../chunk-EAQHZATL.mjs";
import {
  init_esm
} from "../../../../../../chunk-XVMCOVNG.mjs";

// src/trigger/example.ts
init_esm();
var helloWorldTask = task({
  id: "hello-world",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300,
  // Stop executing after 300 secs (5 mins) of compute
  run: async (payload, { ctx }) => {
    logger.log("Hello, world!", { payload, ctx });
    await wait.for({ seconds: 5 });
    return {
      message: "Hello, world!"
    };
  }
});
export {
  helloWorldTask
};
//# sourceMappingURL=example.mjs.map
