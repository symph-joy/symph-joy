import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import got from "got";

describe("joy-config", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("api: should inject config value to a component", async () => {
    const response = await got.get(testContext.getUrl("/api/hello"), {
      throwHttpErrors: false,
      responseType: "text",
    });
    expect(response.body.trim()).toBe("Hello world!");
  }, 999999);
});
