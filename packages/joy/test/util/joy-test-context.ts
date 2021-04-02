import child_process from "child_process";
import {
  findPort,
  killApp,
  joyDev,
  joyBuild,
  joyStart,
} from "./joy-test-utils";
import path from "path";
import { stringify } from "querystring";

export class JoyTestContext {
  public port = 80;
  public host = "localhost";
  public serverProcess?: child_process.ChildProcess;
  public dev = false;

  constructor(public workDir: string) {}

  async killServer() {
    if (this.serverProcess) {
      await killApp(this.serverProcess);
    }
  }

  static async createContext(workDir: string, port?: number) {
    port = port || (await findPort());
    const serverProcess = await joyDev(workDir, port);
    const testContext = new JoyTestContext(workDir);
    testContext.serverProcess = serverProcess;
    testContext.port = port;
    return testContext;
  }

  static async createDevContext(workDir: string, port?: number, args?: any[]) {
    const buildState = await joyBuild(workDir, args);
    console.log(`build finished code:${buildState.code}`);
    console.log(buildState.stdout || buildState.stderr);

    port = 4000 || port || (await findPort());
    const testContext = new JoyTestContext(workDir);
    testContext.dev = true;
    // testContext.serverProcess = await joyStart(workDir, port);
    testContext.port = port;
    return testContext;
  }

  getUrl(pathname: string, query?: any) {
    return `http:${this.host}:${this.port}${pathname}${
      query ? stringify(query) : ""
    }`;
  }
}
