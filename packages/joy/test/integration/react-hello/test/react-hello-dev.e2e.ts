import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitForMoment } from "../../../util/joy-test-utils";

describe("react-dev-hello", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("should render hello page", async () => {
    // await waitForMoment();
    await page.goto(testContext.getUrl("/"));
    const browser = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(browser).toContain("Welcome to Joy!");
  }, 999999);
});
