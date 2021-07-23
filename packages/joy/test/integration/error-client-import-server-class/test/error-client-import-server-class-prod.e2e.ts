import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";

describe("error-client-import-server-class:prod", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createServerContext(
      curPath,
      undefined,
      [],
      { stdout: false, stderr: false, ignoreFail: true }
    );
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("Should build failed, when client side code import a server side component.", async () => {
    expect(testContext.buildState).not.toBeNull();
    expect(testContext.buildState?.code !== 0).toBe(true);
    expect(testContext.buildState?.stderr).toContain(
      'Error import { JoyBoot } from "@symph/joy",'
    );
  }, 999999);
});
