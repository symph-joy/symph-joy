import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { promises } from "fs";
import { findPort, joyBuild, joyExport, killApp, runHttpServer, waitFor } from "../../../util/joy-test-utils";
import { getDomInnerHtml } from "../../../util/html-utils";
import { JoyRouteInitState } from "@symph/react";
import * as child_process from "child_process";

async function checkHtmlFile(filePath: string, domId: string, checkContent: string) {
  expect((await promises.stat(filePath)).isFile()).toBe(true);
  const content = await promises.readFile(filePath, { encoding: "utf-8" });
  expect(getDomInnerHtml(content, "msg")).toBe(checkContent);
}

async function checkDataFile(filePath: string, actionType: string, actionPropName: string, actionPropValue: any) {
  const dataFileState = await promises.stat(filePath);
  expect(dataFileState.isFile()).toBe(true);
  const jsonContext = await promises.readFile(filePath, {
    encoding: "utf-8",
  });
  const jsonObj = JSON.parse(jsonContext);
  expect(jsonObj.find((it: any) => it.type === actionType)).toHaveProperty(actionPropName, actionPropValue);
}

describe("joy export", () => {
  let testContext: JoyTestContext;
  let serverProcess: child_process.ChildProcess;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");

    testContext = new JoyTestContext(curPath);
    await testContext.init();
    // build
    await joyBuild(curPath);
    // export
    const exportState = await joyExport(curPath, "out");
    if (exportState.code !== 0) {
      throw new Error(exportState.stderr || "Export failed.");
    }

    const port = await findPort();
    testContext.port = port;
    serverProcess = await runHttpServer(path.join(curPath, "out"), port);
  }, 999999);

  afterAll(async () => {
    if (serverProcess) {
      await killApp(serverProcess);
    }
  });

  test("Should copy static files.", async () => {
    const filePath = testContext.joyAppConfig.resolveAppDir("out/hello.txt");
    expect((await promises.stat(filePath)).isFile()).toBe(true);
    const content = await promises.readFile(filePath, { encoding: "utf-8" });
    expect(content).toContain("Hello World!");
  }, 999999);

  test("Should export out the pages.", async () => {
    // await waitForMoment()
    const indexHtml = testContext.joyAppConfig.resolveAppDir("out/index.html");
    await checkHtmlFile(indexHtml, "msg", "Hello Index!");
    const helloHtml = testContext.joyAppConfig.resolveAppDir("out/hello.html");
    await checkHtmlFile(helloHtml, "msg", "Hello World!");

    const indexData = testContext.joyAppConfig.resolveAppDir(`out/_joy/data/${testContext.getBuildId()}/index.json`);
    await checkDataFile(indexData, "reactAppInitManager/__SET_STATE", "state./.initStatic", JoyRouteInitState.SUCCESS);
    const helloData = testContext.joyAppConfig.resolveAppDir(`out/_joy/data/${testContext.getBuildId()}/hello.json`);
    await checkDataFile(helloData, "reactAppInitManager/__SET_STATE", "state./hello.initStatic", JoyRouteInitState.SUCCESS);
  }, 999999);

  test("Should export out fs route page.", async () => {
    // await waitForMoment()
    const indexHtml = testContext.joyAppConfig.resolveAppDir("out/sub-route/fs-route.html");
    await checkHtmlFile(indexHtml, "msg", "hello fs route");

    const indexData = testContext.joyAppConfig.resolveAppDir(`out/_joy/data/${testContext.getBuildId()}/sub-route/fs-route.json`);
    await checkDataFile(indexData, "reactAppInitManager/__SET_STATE", "state./sub-route/fs-route.initStatic", JoyRouteInitState.SUCCESS);
  }, 999999);

  test("Should pre fetch api data and write to file.", async () => {
    const apiFile = testContext.joyAppConfig.resolveAppDir("out/api/hello");
    const content = await promises.readFile(apiFile, { encoding: "utf-8" });
    expect(content).toContain("hello from api");

    const htmlFile = testContext.joyAppConfig.resolveAppDir("out/with-api.html");
    await checkHtmlFile(htmlFile, "msg", "hello from model");

    await page.goto(testContext.getUrl("/with-api"));
    let msg = await page.innerText("#msg");
    expect(msg).toBe("hello from model");
    await page.click("#btnFetchMsg");
    msg = await page.innerText("#msg");
    expect(msg).toBe("hello from api");
  }, 999999);

  test("Should export with styles.", async () => {
    await page.goto(testContext.getUrl("/style/with-style"));
    const cssStyleColor = await page.$eval("#msg", (e: any) => getComputedStyle(e).color);
    expect(cssStyleColor).toBe("rgb(255, 0, 0)");
  }, 999999);

  test("should reload controller, when history pushed url is matched to current dynamic rout.", async () => {
    await page.goto(testContext.getUrl("/dynamic/hello1"));
    let msg = await page.innerHTML("#message");
    expect(msg).toBe("hello1");
    const [res] = await Promise.all([
      page.waitForResponse((response) => response.url().includes("/dynamic/hello2.json")),
      page.click("#link-hello2"),
    ]);

    const data = (await res.json()) as Array<any>;
    // 是否正常返回了数据
    expect(data?.length).toBeTruthy();

    msg = await page.innerHTML("#message");
    expect(msg).toBe("hello2");
  });
});
