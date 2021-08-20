import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitForMoment } from "../../../util/joy-test-utils";
import got from "got";

describe("dynamic load", () => {
  let start: number;
  let testContext: JoyTestContext;
  beforeAll(async () => {
    start = Date.now();
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("react: should render hello message", async () => {
    // await waitForMoment()
    await page.goto(testContext.getUrl("/dynamic-1"));
    const browser = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(browser).toContain("hello dynamic 1");
  }, 999999);

  // todo 实现完整测试案例
});
