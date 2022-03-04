import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { staticCases } from "./static-cases";
import { findPort, joyBuild, joyExport, killApp, runHttpServer, waitFor } from "../../../util/joy-test-utils";
import { imagesImportCases } from "./images-import-cases";
import { imagesComponentCases } from "./images-component-cases";
import child_process from "child_process";
import { imagesOptimizerCases } from "./images-optimizer-cases";

describe("server-static", () => {
  describe("dev", () => {
    const curPath = path.resolve(__dirname, "../");
    let testContext: JoyTestContext = new JoyTestContext(curPath);

    beforeAll(async () => {
      await testContext.startDev();
      // await waitFor();
    }, 9999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    test("start", async () => {}, 999999);

    describe("cases", () => {
      staticCases(testContext);
      imagesImportCases(testContext);
      imagesOptimizerCases(testContext);
      imagesComponentCases(testContext);
    });
  });

  describe("prod", () => {
    const curPath = path.resolve(__dirname, "../");
    let testContext: JoyTestContext = new JoyTestContext(curPath);

    beforeAll(async () => {
      await testContext.start();
      // await waitFor();
    }, 30000000);

    afterAll(async () => {
      await testContext.killServer();
    });

    test("cases", async () => {}, 999999999);

    describe("features", () => {
      staticCases(testContext);
      imagesImportCases(testContext);
      imagesOptimizerCases(testContext);
      imagesComponentCases(testContext);
    });
  });

  describe("export", () => {
    const curPath = path.resolve(__dirname, "../");
    let testContext: JoyTestContext = new JoyTestContext(curPath);
    let serverProcess: child_process.ChildProcess;
    beforeAll(async () => {
      await testContext.init();
      // build
      await joyBuild(curPath, undefined, {
        env: {
          NODE_ENV: "export",
        },
      });
      // export
      const exportState = await joyExport(curPath, "out", {
        env: {
          NODE_ENV: "export",
        },
      });
      if (exportState.code !== 0) {
        throw new Error(exportState.stderr || "Export failed.");
      }

      const port = await findPort();
      testContext.port = port;
      serverProcess = await runHttpServer(path.join(curPath, "out"), port);
      // await waitFor();
    }, 999999);

    afterAll(async () => {
      if (serverProcess) {
        await killApp(serverProcess);
      }
    });

    test("cases", async () => {}, 999999999);

    describe("features", () => {
      staticCases(testContext);
      imagesImportCases(testContext);
      imagesComponentCases(testContext);
    });
  });
});
