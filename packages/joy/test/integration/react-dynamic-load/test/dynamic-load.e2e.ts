import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitFor } from "../../../util/joy-test-utils";
import { Response } from "playwright-core/types/types";
import got from "got";
import cheerio from "cheerio";

describe("dynamic load", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    // testContext = await JoyTestContext.createDevServerContext(curPath, 3001);
    testContext = await JoyTestContext.createServerContext(curPath);
    // await waitFor();
  }, 9999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("Should dynamic load import module, using import().", async () => {
    await page.goto(testContext.getUrl("/import-hello"));
    let jsRes: Response;
    if (testContext.dev) {
      [jsRes] = await Promise.all([page.waitForResponse((res) => res.url().includes("hello_import")), page.click("#btnSayHello")]);
    } else {
      [jsRes] = await Promise.all([page.waitForResponse((res) => !!res.url().match(/\d+\.[0-9a-z]{20}\.js/)), page.click("#btnSayHello")]);
    }
    const msg = await page.innerHTML("#importHelloMsg");
    expect(msg).toContain("Hello Import");
  }, 999999);

  test("Should dynamic load module, using dynamic().", async () => {
    await page.goto(testContext.getUrl("/links"));
    let jsRes: Response;
    if (testContext.dev) {
      [jsRes] = await Promise.all([page.waitForResponse((res) => res.url().includes("third_module")), page.click("#dynamic-module")]);
    } else {
      [jsRes] = await Promise.all([page.waitForResponse((res) => !!res.url().match(/\d+\.[0-9a-z]{20}\.js/)), page.click("#dynamic-module")]);
    }
    const msg = await page.innerHTML("#thirdMessage");
    expect(msg).toContain("Hello third module");
  }, 999999);

  test("Should server render dynamic module, and collect its js bundle.", async () => {
    const resBody = await got(testContext.getUrl("/dynamic-module")).text();
    const $ = cheerio.load(resBody);
    const msg = $("#thirdMessage").html();
    expect(msg).toContain("Hello third module");

    const jsBundles = $("script");
    let jsBundle: any;
    jsBundles.each((index) => {
      const it = jsBundles[index];
      if (testContext.dev) {
        if (it.attribs?.src?.match(/third_module/)) {
          jsBundle = it;
        }
      } else {
        if (it.attribs?.src?.match(/\d+\.[0-9a-z]{20}\.js/)) {
          jsBundle = it;
        }
      }
    });
    expect(jsBundle).not.toBeUndefined();
  }, 999999);

  test("Should dynamic load route component, using @DynamicLoad().", async () => {
    await page.goto(testContext.getUrl("/links"));
    let jsRes: Response;
    if (testContext.dev) {
      [jsRes] = await Promise.all([page.waitForResponse((res) => res.url().includes("dynamic_route_page")), page.click("#dynamic-route")]);
    } else {
      [jsRes] = await Promise.all([page.waitForResponse((res) => !!res.url().match(/\d+\.[0-9a-z]{20}\.js/)), page.click("#dynamic-route")]);
    }
    const msg = await page.innerHTML("#dynamicRouteMsg");
    expect(msg).toContain("Hello dynamic load page 1.");
  }, 999999);
});
