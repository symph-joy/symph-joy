import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import got from "got";

describe("error-client-import-server-class", () => {
  describe("dev", () => {
    let testContext: JoyTestContext;
    beforeAll(async () => {
      const curPath = path.resolve(__dirname, "../");
      testContext = await JoyTestContext.createDevServerContext(curPath);
    });

    afterAll(async () => {
      await testContext.killServer();
    });

    test("Should build failed, when client side code import a server side component.", async () => {
      const response = await got.get(testContext.getUrl("/"), {
        throwHttpErrors: false,
        responseType: "text",
      });
      expect(response.statusCode).toBe(500);
      const html = response.body.trim();
      expect(html).toContain('Error import { JoyBoot } from \\"@symph/joy\\",');
    });
  });

  describe("prod", () => {
    let testContext: JoyTestContext;
    beforeAll(async () => {
      const curPath = path.resolve(__dirname, "../");
      testContext = await JoyTestContext.createServerContext(curPath, undefined, [], { stdout: false, stderr: false, ignoreFail: true });
    });

    afterAll(async () => {
      await testContext.killServer();
    });

    test("Should build failed, when client side code import a server side component.", async () => {
      expect(testContext.buildState).not.toBeNull();
      expect(testContext.buildState?.code !== 0).toBe(true);
      expect(testContext.buildState?.stderr).toContain('Error import { JoyBoot } from "@symph/joy",');
    });
  });
});
