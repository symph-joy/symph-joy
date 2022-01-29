import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";

describe("react-custom-error", () => {
  describe("prod", () => {
    let testContext: JoyTestContext;
    beforeAll(async () => {
      const curPath = path.resolve(__dirname, "../");
      testContext = await JoyTestContext.createServerContext(curPath);
      // await waitFor();
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    describe("pages/_error.tsx", () => {
      test("Should render custom pages/_error.tsx, when page throw an exception.", async () => {
        await page.goto(testContext.getUrl("/throw-err"));
        const title = await page.innerHTML("#title");
        const statusCode = await page.innerHTML("#statusCode");
        const pageTitle = await page.innerHTML("#pageTitle");
        expect(title).toContain(" Internal Server Error");
        expect(statusCode).toBe("500");
        expect(pageTitle).toBe("Custom Error");
      }, 999999);
    });

    describe("pages/404.tsx", () => {
      test("Should render custom 404 page, when route is not found.", async () => {
        const [res] = await Promise.all([
          page.waitForResponse((res) => res.url().includes("/not-exists-route")),
          page.goto(testContext.getUrl("/not-exists-route")),
        ]);
        expect(res.status()).toBe(404);
        const pageTitle = await page.innerHTML("#title");
        expect(pageTitle).toBe("Custom 404");
      }, 999999);

      test("Should render /404 page as a normal page.", async () => {
        const [res] = await Promise.all([page.waitForResponse((res) => res.url().includes("/404")), page.goto(testContext.getUrl("/404"))]);
        expect(res.status()).toBe(404);
        const pageTitle = await page.innerHTML("#title");
        expect(pageTitle).toBe("Custom 404");
      }, 999999);
    });
  });
});
