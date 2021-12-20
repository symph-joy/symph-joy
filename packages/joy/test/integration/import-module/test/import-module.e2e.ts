import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitFor } from "../../../util/joy-test-utils";
import got from "got";
import spawn from "cross-spawn";

describe("import-module", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    const thirdModulePath = path.resolve(__dirname, "../third-module");
    spawn.sync("npx", ["tsc", "-p", "tsconfig.json", "--sourcemap"], { cwd: thirdModulePath });
    testContext = await JoyTestContext.createDevServerContext(curPath);
    // await waitFor();
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("main module api", async () => {
    const response = await got.get(testContext.getUrl("/api/hello"), {
      throwHttpErrors: false,
      responseType: "text",
    });
    expect(response.body.trim()).toBe("Hello main");
  }, 999999);

  test("main module page", async () => {
    await page.goto(testContext.getUrl("/"));
    const message = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(message).toBe("Hello main");
  }, 999999);

  test("third module api", async () => {
    const response = await got.get(testContext.getUrl("/api/third/third-hello"), {
      throwHttpErrors: false,
      responseType: "text",
    });
    expect(response.body.trim()).toBe("Hello third module");
  });

  test("third module page", async () => {
    await page.goto(testContext.getUrl("/third"));
    const message = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(message).toBe("Hello third module");
  });
});
