import "jest-playwright-preset";
import * as path from "path";
import { join } from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { check, waitFor } from "../../../util/joy-test-utils";
import { readFileSync, writeFileSync } from "fs";

describe("react-custom-document", () => {
  describe("build", () => {
    let testContext: JoyTestContext;
    beforeAll(async () => {
      const curPath = path.resolve(__dirname, "../");
      testContext = await JoyTestContext.createDevServerContext(curPath);
      // await waitFor();
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    describe("pages/_document.tsx", () => {
      test("should render pages/_document.tsx", async () => {
        await page.goto(testContext.getUrl("/"));
        const msg = await page.innerHTML("#hello-document");
        expect(msg).toBe("Hello Document");
      }, 999999);

      it("should detect the changes to pages/_document.tsx and display it", async () => {
        const appPath = join(__dirname, "../", "src/pages", "_document.tsx");
        const originalContent = readFileSync(appPath, "utf8");
        try {
          await page.goto(testContext.getUrl("/"));
          const text = await page.innerText("#hello-document-hmr");
          expect(text).toBe("Hello Document HMR");

          const editedContent = originalContent.replace("Hello Document HMR", "Hi Document HMR");

          // change the content
          writeFileSync(appPath, editedContent, "utf8");

          await check(() => page.innerText("#hello-document-hmr"), /Hi Document HMR/);

          // add the original content
          writeFileSync(appPath, originalContent, "utf8");

          await check(() => page.innerText("#hello-document-hmr"), /Hello Document HMR/);
        } finally {
          writeFileSync(appPath, originalContent, "utf8");
        }
      });
    });

    describe("pages/_app.tsx", () => {
      test("should render pages/_app.tsx", async () => {
        await page.goto(testContext.getUrl("/"));
        const msg = await page.innerHTML("#hello-app");
        expect(msg).toBe("Hello App");
      }, 999999);

      it("should detect the changes to pages/_app.tsx and display it", async () => {
        const appPath = join(__dirname, "../", "src/pages", "_app.tsx");
        const originalContent = readFileSync(appPath, "utf8");
        try {
          await page.goto(testContext.getUrl("/"));
          const text = await page.innerText("#hello-app-hmr");
          expect(text).toBe("Hello App HMR");

          const editedContent = originalContent.replace("Hello App HMR", "Hi App HMR");

          // change the content
          writeFileSync(appPath, editedContent, "utf8");

          await check(() => page.innerText("#hello-app-hmr"), /Hi App HMR/);

          // add the original content
          writeFileSync(appPath, originalContent, "utf8");

          await check(() => page.innerText("#hello-app-hmr"), /Hello App HMR/);
        } finally {
          writeFileSync(appPath, originalContent, "utf8");
        }
      });
    });
  });
});
