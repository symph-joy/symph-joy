import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { renderViaHTTP, waitFor } from "../../../util/joy-test-utils";
import { promises } from "fs";
import { getDomInnerHtml } from "../../../util/html-utils";
import { JOY_DATA } from "../../../../src/joy-server/lib/utils";
import { statefulCases } from "./stateful.cases";
import { staticCases } from "./static.caces";
import { embedCases } from "./embed.cases";

describe("react-prerender", () => {
  describe("prod, prerender", () => {
    const curPath = path.resolve(__dirname, "../");
    let testContext: JoyTestContext = new JoyTestContext(curPath);

    beforeAll(async () => {
      await testContext.start();
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    describe("static page", () => {
      staticCases(testContext);
    });

    describe("stateful page", () => {
      statefulCases(testContext);
    });

    describe("embed", () => {
      embedCases(testContext);
    });

    describe("dynamic route", () => {
      test("should export out static file, which url path was specified in static path generator", async () => {
        async function checkOutputFile(path: string, checkText: string) {
          const hello1OutputHtml = testContext.joyAppConfig.resolveSSGOutDir(`${path}.html`);
          const htmlFileState = await promises.stat(hello1OutputHtml);
          expect(htmlFileState.isFile()).toBe(true);
          const fileContext = await promises.readFile(hello1OutputHtml, {
            encoding: "utf-8",
          });
          const msg = getDomInnerHtml(fileContext, "#msg");
          expect(msg).toBe(checkText);

          const staticOutputData = testContext.joyAppConfig.resolveSSGOutDir(`${path}.json`);
          const dataFileState = await promises.stat(staticOutputData);
          expect(dataFileState.isFile()).toBe(true);
        }

        await checkOutputFile("./dynamic/hello1", "hello1");
        await checkOutputFile("./dynamic/hello2", "hello2");
      });

      test("should fetch data.json, when when the path has been ssg", async () => {
        await page.goto(testContext.getUrl("/links"));
        await page.click("#dynamic-hello1");
        const res = await page.waitForResponse((response) => response.url().includes("/dynamic/hello1.json"));
        const data = (await res.json()) as Array<any>;
        // 是否正常返回了数据
        expect(data?.length).toBeTruthy();
      });

      test("should reload when push new url is matched to current dynamic rout.", async () => {
        await page.goto(testContext.getUrl("/dynamic/hello1"));
        let msg = await page.innerHTML("#msg");
        expect(msg).toBe("hello1");

        await Promise.all([page.click("#link-hello2")]);
        msg = await page.innerHTML("#msg");

        expect(msg).toBe("hello2");
      });
    });

    describe("revalidate", () => {
      test("should export out initialRevalidateSeconds", async () => {
        const filePath = testContext.joyAppConfig.resolveBuildOutDir("react/prerender-manifest.json");
        const fileContext = await promises.readFile(filePath, {
          encoding: "utf-8",
        });
        const manifest = JSON.parse(fileContext);
        const route = manifest.routes["/revalidate"];
        expect(route).toBeTruthy();
        expect(route.initialRevalidateSeconds).toBe(1);
      });

      test("should has Cache-Control in http response header", async () => {
        const [res] = await Promise.all([
          page.waitForResponse((response) => response.url().includes("/revalidate")),
          page.goto(testContext.getUrl("/revalidate")),
        ]);
        // const res = await page.waitForResponse((response) => response.url().includes("/revalidate"));
        const header = res.headers();
        // 是否正常返回了数据
        expect(header["cache-control"]).toBe("s-maxage=1, stale-while-revalidate");
      });
    });
  });

  describe("dev, ssr=true", () => {
    const appDir = path.resolve(__dirname, "../");
    const testContext = new JoyTestContext(appDir, true);

    beforeAll(async () => {
      await testContext.startDev(undefined, { env: { ssr: true } });
      // await waitFor();
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    describe("stateful page", () => {
      statefulCases(testContext);
    });

    describe("embed", () => {
      embedCases(testContext);
    });
  });

  describe("dev, ssr=false", () => {
    let testContext: JoyTestContext;

    beforeAll(async () => {
      const appDir = path.resolve(__dirname, "../");
      testContext = await JoyTestContext.createDevServerContext(appDir, undefined, { env: { ssr: false } });
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    describe("static page", () => {
      test("Should server render nothing when ssr is closed.", async () => {
        const httpResp = await renderViaHTTP(testContext.port, "/stateful");
        let content = getDomInnerHtml(httpResp, "#__joy");
        expect(content).toBe("");

        let joyDataStr = getDomInnerHtml(httpResp, "#__JOY_DATA__");
        const joyData = JSON.parse(joyDataStr || "") as JOY_DATA;
        expect(joyData.ssr).toBe(false);
      }, 999999);

      test("Should client render page as usual.", async () => {
        await page.goto(testContext.getUrl("/static"));
        const msg = await page.$eval("#message", (el: any) => el.innerHTML);
        expect(msg).toBe("this is a static route page");
      }, 999999);
    });
  });
});
