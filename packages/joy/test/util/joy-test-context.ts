import child_process from "child_process";
import { findPort, joyBuild, joyDev, joyStart, killApp, RunOptions } from "./joy-test-utils";
import { stringify } from "querystring";
import { JoyAppConfig } from "@symph/joy";
import fs from "fs";

export class JoyTestContext {
  public buildState?: { code: number; stdout?: string; stderr?: string };
  public joyAppConfig: JoyAppConfig;

  public port = 80;
  public host = "localhost";
  public serverProcess?: child_process.ChildProcess;
  private isInit = false;

  private cachedBuildId: string;

  constructor(public workDir: string, public dev = false) {}

  async init(): Promise<this> {
    this.isInit = true;
    this.joyAppConfig = new JoyAppConfig();
    this.joyAppConfig.mergeCustomConfig({ dir: this.workDir, distDir: ".joy" });
    return this;
  }

  async start(port?: number, buildArgs?: any[], buildOpts?: RunOptions, startOpts?: RunOptions) {
    const workDir = this.workDir;
    await this.init();
    this.dev = false;

    if (!this.isInit) {
      await this.init();
    }
    const buildState = await joyBuild(workDir, buildArgs, buildOpts);
    this.buildState = buildState;
    if (buildState.code !== 0) {
      if (!buildOpts?.ignoreFail) {
        throw new Error(buildState.stderr || "JoyTestContext: build failed.");
      }
      return;
    }
    port = port || (await findPort());
    this.port = port;
    this.serverProcess = await joyStart(workDir, port, startOpts);
    return this;
  }

  async startDev(port?: number, runOpts?: RunOptions) {
    const workDir = this.workDir;
    if (!this.isInit) {
      await this.init();
    }
    this.dev = true;
    port = port || (await findPort());
    this.port = port;
    const serverProcess = await joyDev(workDir, port, runOpts);
    this.serverProcess = serverProcess;
    return this;
  }

  getBuildId(): string {
    if (this.cachedBuildId) {
      return this.cachedBuildId;
    }
    const buildIdFile = this.joyAppConfig.resolveBuildOutDir("react/BUILD_ID");
    if (fs.existsSync(buildIdFile)) {
      this.cachedBuildId = fs.readFileSync(buildIdFile, "utf8").trim();
    } else {
      this.cachedBuildId = "development";
    }

    return this.cachedBuildId;
  }

  async killServer() {
    if (this.serverProcess) {
      await killApp(this.serverProcess);
    }
  }

  static async createDevServerContext(workDir: string, port?: number, runOpts?: RunOptions) {
    const testContext = new JoyTestContext(workDir);
    await testContext.startDev(port, runOpts);
    return testContext;
  }

  static async createServerContext(workDir: string, port?: number, buildArgs?: any[], buildOpts?: RunOptions, startOpts?: RunOptions) {
    const testContext = new JoyTestContext(workDir);
    await testContext.start(port, buildArgs, buildOpts, startOpts);
    return testContext;
  }

  getUrl(pathname: string, query?: any) {
    return `http:${this.host}:${this.port}${pathname}${query ? stringify(query) : ""}`;
  }
}
