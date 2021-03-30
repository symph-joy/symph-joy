import child_process from "child_process";
import { findPort, killApp, launchApp } from "./joy-test-utils";
import path from "path";
import { stringify } from "querystring";

export class JoyTestContext {
  public port = 80;
  public host = "localhost";
  public serverProcess?: child_process.ChildProcess;

  constructor(public workDir: string) {}

  async killServer() {
    if (this.serverProcess) {
      await killApp(this.serverProcess);
    }
  }

  static async createContext(workDir?: string, port?: number) {
    workDir = workDir || path.resolve(__dirname, "../");
    port = port || (await findPort());
    const serverProcess = await launchApp(workDir, port);
    const testContext = new JoyTestContext(workDir);
    testContext.serverProcess = serverProcess;
    testContext.port = port;
    return testContext;
  }

  getUrl(pathname: string, query?: any) {
    return `http:${this.host}:${this.port}${pathname}${
      query ? stringify(query) : ""
    }`;
  }
}
