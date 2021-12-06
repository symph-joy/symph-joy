import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { promises } from "fs";
import { joyBuild, joyExport, waitForMoment } from "../../../util/joy-test-utils";
import { getDomInnerHtml } from "../../../util/html-utils";
import { JoyRouteInitState } from "@symph/react";

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
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    // build
    // testContext = await JoyTestContext.createServerContext(curPath);
    testContext = new JoyTestContext(curPath);
    await testContext.init();
    await joyBuild(curPath);
    // export
    const exportState = await joyExport(curPath, "out");
    if (exportState.code !== 0) {
      throw new Error(exportState.stderr || "Export failed.");
    }
  }, 999999);

  afterAll(async () => {});

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
});
