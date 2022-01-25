import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import got from "got";

describe("hello joy dev", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("api: should return hello message", async () => {
    const response = await got.get(testContext.getUrl("/api/hello"), {
      throwHttpErrors: false,
      responseType: "text",
    });
    expect(response.body.trim()).toBe("Hello Joy!");
  }, 999999);

  test("react: should render hello message", async () => {
    await page.goto(testContext.getUrl("/"));
    const msg = await page.innerHTML("#message");
    expect(msg).toContain("Hello World!");

    await page.click("#btnUpdateMessage");
    await page.waitForFunction(() => document?.getElementById("message")?.innerHTML === "Hello Joy!");
    const msgUpdated = await page.innerHTML("#message");
    expect(msgUpdated).toContain("Hello Joy!");
  }, 999999);
});
