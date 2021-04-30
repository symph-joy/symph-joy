import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { join } from "path";
import fs from "fs-extra";
import {
  joyBuild,
  renderViaHTTP,
  waitForMoment,
} from "../../../util/joy-test-utils";
import { promises } from "fs";

function getDivContentHtml(html: string, id: string): string | undefined {
  if (!html) {
    return undefined;
  }
  const regDiv = new RegExp(
    `<div [\\s\\S]*?id=['"]${id}['"][\\s\\S]*?>([\\s\\S]*?)</div>`
  );
  const matched = html.match(regDiv);
  if (matched) {
    return matched[1];
  }
  return undefined;
}

describe("prerender", () => {
  let testContext: JoyTestContext;

  beforeAll(async () => {
    const appDir = path.resolve(__dirname, "../");
    // await fs.remove(join(appDir, '.joy'))
    testContext = await JoyTestContext.createServerContext(appDir);
    console.log(">>> build completed:");
  }, 3000000);

  afterAll(async () => {
    await testContext.killServer();
    console.log(">>>>> server close");
  });

  describe("static page", () => {
    test("should output static html and data json file", async () => {
      const staticOutputHtml = testContext.joyAppConfig.resolveSSGOutDir(
        "./static.html"
      );
      const htmlFileState = await promises.stat(staticOutputHtml);
      expect(htmlFileState.isFile()).toBe(true);
      const fileContext = await promises.readFile(staticOutputHtml, {
        encoding: "utf-8",
      });
      expect(fileContext.indexOf("this is a static route page") > 0).toBe(true);

      const staticOutputData = testContext.joyAppConfig.resolveSSGOutDir(
        "./static.json"
      );
      const dataFileState = await promises.stat(staticOutputData);
      expect(dataFileState.isFile()).toBe(true);
    });

    test("should response the static html file，which route was prerendered during ssg.", async () => {
      const staticOutput = testContext.joyAppConfig.resolveSSGOutDir(
        "./static.html"
      );
      const fileContext = await promises.readFile(staticOutput, {
        encoding: "utf-8",
      });
      const matched = fileContext.match(/timestamp:(?:<!-- -->)?([\d]+)/);
      expect(matched).toBeTruthy();
      const prerenderTs = matched![1];

      const resContext = await renderViaHTTP(testContext.port, "/static");
      const resMatched = resContext.match(/timestamp:(?:<!-- -->)?([\d]+)/);
      expect(resMatched).toBeTruthy();
      const resTs = resMatched![1];
      expect(resTs).toBe(prerenderTs);
    }, 1111111111);
  });

  describe("stateful page", () => {
    test("should only init static state during ssg.", async () => {
      const staticOutput = testContext.joyAppConfig.resolveSSGOutDir(
        "./stateful.html"
      );
      const fileContext = await promises.readFile(staticOutput, {
        encoding: "utf-8",
      });
      const ssgStaticMessage = getDivContentHtml(fileContext, "staticMessage");
      const ssgStaticUpdateTime = getDivContentHtml(
        fileContext,
        "staticUpdateTime"
      );
      const ssgDynamicMessage = getDivContentHtml(
        fileContext,
        "dynamicMessage"
      );
      const ssgDynamicUpdateTime = getDivContentHtml(
        fileContext,
        "dynamicUpdateTime"
      );
      expect(ssgStaticMessage).toBe("hello from initialModelStaticState");
      expect(ssgDynamicMessage).toBe("init dynamic message");
      expect(Number(ssgStaticUpdateTime) > 0).toBeTruthy();
      expect(Number(ssgDynamicUpdateTime) === 0).toBeTruthy();

      await page.goto(testContext.getUrl("/stateful"));
      const browserStaticMessage = await page.$eval(
        "#staticMessage",
        (el: any) => el.innerHTML
      );
      const browserStaticUpdateTime = await page.$eval(
        "#staticUpdateTime",
        (el: any) => el.innerHTML
      );
      const browserDynamicMessage = await page.$eval(
        "#dynamicMessage",
        (el: any) => el.innerHTML
      );
      const browserDynamicUpdateTime = await page.$eval(
        "#dynamicUpdateTime",
        (el: any) => el.innerHTML
      );
      // browser should not execute initStaticModelState, so the updateTime should not changed
      expect(ssgStaticUpdateTime).toBe(browserStaticUpdateTime);
      expect(Number(browserDynamicUpdateTime) > 0).toBeTruthy();
    }, 1111111111);
  });

  test("should render hello page", async () => {
    const buildOutput = testContext?.buildState?.stdout;
    console.log(">>> buildOutput:", buildOutput);
    await waitForMoment();
    // await page.goto(testContext.getUrl("/"));
    // const browser = await page.$eval("#message", (el: any) => el.innerHTML);
    // expect(browser).toContain("Welcome to Joy!");
  }, 9999999);
});
