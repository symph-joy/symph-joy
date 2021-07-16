import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitForMoment } from "../../../util/joy-test-utils";
import got from "got";

describe("hello joy dev", () => {
  let start: number;
  let testContext: JoyTestContext;
  beforeAll(async () => {
    start = Date.now();
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("api: should return hello message", async () => {
    const response = (await got.get(testContext.getUrl("/api/hello"), {
      throwHttpErrors: false,
      responseType: "text",
    })) as any;
    expect(response.body.trim()).toBe("Hello world!");
  }, 99999999);

  test("react: should render hello message", async () => {
    // await waitForMoment()
    await page.goto(testContext.getUrl("/"));
    const browser = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(browser).toContain("Hello world!");
  }, 99999999);
});
