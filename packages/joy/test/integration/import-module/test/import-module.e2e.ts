import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitForMoment } from "../../../util/joy-test-utils";
import got from "got";
import spawn from "cross-spawn";

describe("import-module", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    const thirdModulePath = path.resolve(__dirname, "../third-module");
    spawn.sync("npx", ["tsc", "-p", "tsconfig.json", "--sourcemap"], { cwd: thirdModulePath });
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("should import third module", async () => {
    await waitForMoment();
    const response = await got.get(testContext.getUrl("/api/hello"), {
      throwHttpErrors: false,
      responseType: "text",
    });
    expect(response.body.trim()).toBe("Hello main");
  }, 99999999);
});
