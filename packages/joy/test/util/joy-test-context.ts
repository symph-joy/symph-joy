import child_process from "child_process";
import {
  findPort,
  killApp,
  joyDev,
  joyBuild,
  joyStart,
} from "./joy-test-utils";
import { stringify } from "querystring";
import { CoreContext, EntryType } from "@symph/core";
import { JoyAppConfig } from "@symph/joy";

export class JoyTestContext extends CoreContext {
  public buildState?: { code: number; stdout?: string; strerr?: string };
  public joyAppConfig: JoyAppConfig;

  public port = 80;
  public host = "localhost";
  public serverProcess?: child_process.ChildProcess;
  public dev = false;

  constructor(public workDir: string, entry: EntryType = {}) {
    super({
      joyAppConfig: JoyAppConfig,
      ...entry,
    });
  }

  async init(): Promise<this> {
    await super.init();
    this.joyAppConfig = await this.get(JoyAppConfig);
    this.joyAppConfig.mergeCustomConfig({ dir: this.workDir });
    return this;
  }

  async killServer() {
    if (this.serverProcess) {
      await killApp(this.serverProcess);
    }
  }

  static async createDevServerContext(workDir: string, port?: number) {
    port = port || (await findPort());
    const serverProcess = await joyDev(workDir, port);
    const testContext = new JoyTestContext(workDir);
    testContext.serverProcess = serverProcess;
    testContext.port = port;
    return testContext;
  }

  static async createServerContext(
    workDir: string,
    port?: number,
    args?: any[]
  ) {
    const start = process.hrtime();
    console.log(">>>>> start build", start);
    const buildState = await joyBuild(workDir, args);
    console.log(">>>>> build finished", process.hrtime(start));

    port = 4000 || port || (await findPort());
    console.log(">>>>> start run", start);
    const testContext = new JoyTestContext(workDir);
    await testContext.init();
    testContext.buildState = buildState;
    testContext.dev = true;
    testContext.serverProcess = await joyStart(workDir, port);
    testContext.port = port;
    return testContext;
  }

  getUrl(pathname: string, query?: any) {
    return `http:${this.host}:${this.port}${pathname}${
      query ? stringify(query) : ""
    }`;
  }
}
