import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";

describe("build-hello", () => {
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

  test("should render hello page", async () => {
    await page.goto(testContext.getUrl("/"));
    const browser = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(browser).toContain("Welcome to Joy!");
  }, 999999);
});
