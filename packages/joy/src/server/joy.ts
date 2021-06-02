import { JoyServer, ServerConstructor } from "../joy-server/server/joy-server";
import { NON_STANDARD_NODE_ENV } from "../lib/constants";
import * as log from "../build/output/log";

type JoyServerConstructor = ServerConstructor & {
  /**
   * Whether to launch Joy.js in dev mode - @default false
   */
  dev?: boolean;
};

// This file is used for when users run `require('joy')`
function createServer(options: JoyServerConstructor): JoyServer {
  const standardEnv = ["production", "development", "test"];

  if (options == null) {
    throw new Error("The server has not been instantiated properly.");
  }

  if (
    !(options as any).isJoyDevCommand &&
    process.env.NODE_ENV &&
    !standardEnv.includes(process.env.NODE_ENV)
  ) {
    log.warn(NON_STANDARD_NODE_ENV);
  }

  if (options.dev) {
    if (typeof options.dev !== "boolean") {
      console.warn(
        "Warning: 'dev' is not a boolean which could introduce unexpected behavior."
      );
    }

    const JoyDevServer = require("./joy-dev-server").JoyDevServer;
    return new JoyDevServer(options);
  }

  // @ts-ignore
  return new JoyServer(options);
}

// Support commonjs `require('@symph/joy')`
module.exports = createServer;
exports = module.exports;

// Support `import joy from '@symph/joy'`
export default createServer;
