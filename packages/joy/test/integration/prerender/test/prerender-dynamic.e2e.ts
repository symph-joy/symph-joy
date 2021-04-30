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

  describe("static page route", () => {
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

  // describe('dynamic page route', () => {
  //   test('should prerender output data file.', async () => {
  //     const staticOutput = testContext.joyAppConfig.resolveSSGOutDir('./dynamic/1.json')
  //     const fileContext = await promises.readFile(staticOutput, {encoding: 'utf-8'})
  //     const matched = fileContext.match('')
  //     expect(matched).toBeTruthy()
  //     const prerenderTs = matched![1]
  //
  //     const resContext = await renderViaHTTP(testContext.port, '/static')
  //     const resMatched = resContext.match(/timestamp:(?:<!-- -->)?([\d]+)/)
  //     expect(resMatched).toBeTruthy()
  //     const resTs = resMatched![1]
  //     expect(resTs).toBe(prerenderTs)
  //   }, 1111111111)
  // })

  test("should render hello page", async () => {
    const buildOutput = testContext?.buildState?.stdout;
    console.log(">>> buildOutput:", buildOutput);
    await waitForMoment();
    // await page.goto(testContext.getUrl("/"));
    // const browser = await page.$eval("#message", (el: any) => el.innerHTML);
    // expect(browser).toContain("Welcome to Joy!");
  }, 9999999);
});
