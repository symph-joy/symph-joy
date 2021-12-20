import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitFor } from "../../../util/joy-test-utils";

describe("react-hello", () => {
  describe("build", () => {
    let testContext: JoyTestContext;
    beforeAll(async () => {
      const curPath = path.resolve(__dirname, "../");
      testContext = await JoyTestContext.createServerContext(curPath);
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    test("should render hello page", async () => {
      await page.goto(testContext.getUrl("/"));
      const browser = await page.innerHTML("#message");

      expect(browser).toContain("Welcome to Joy!");
    }, 999999);
  });

  describe("dev", () => {
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
});
