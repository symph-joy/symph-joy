import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { renderViaHTTP, waitForMoment } from "../../../util/joy-test-utils";
import { getDomInnerHtml } from "../../../util/html-utils";
import { JOY_DATA } from "../../../../src/joy-server/lib/utils";

describe("react dev, devSSR=close", () => {
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
      let content = getDomInnerHtml(httpResp, "__joy");
      expect(content).toBe("");

      let joyDataStr = getDomInnerHtml(httpResp, "__JOY_DATA__", "script");
      const joyData = JSON.parse(joyDataStr || "") as JOY_DATA;
      expect(joyData.ssr).toBe(false);
    }, 999999);

    test("Should client render page as usual.", async () => {
      await page.goto(testContext.getUrl("/static"));
      const msg = await page.$eval("#message", (el: any) => el.innerHTML);
      expect(msg).toBe("this is a static route page");
    }, 999999);
  });

  // describe("stateful page", () => {
  //   test("Should render the stateful page without init model state.", async () => {
  //     const httpResp = await renderViaHTTP(testContext.port, "/stateful");
  //     let staticMessage = getDomInnerHtml(httpResp, "staticMessage");
  //     let staticUpdateTime = getDomInnerHtml(httpResp, "staticUpdateTime");
  //     expect(staticMessage).toBe("init static message");
  //     expect(staticUpdateTime).toBe("0");
  //
  //     let dynamicMessage = getDomInnerHtml(httpResp, "dynamicMessage");
  //     let dynamicUpdateTime = getDomInnerHtml(httpResp, "dynamicUpdateTime");
  //     expect(dynamicMessage).toBe("init dynamic message");
  //     expect(dynamicUpdateTime).toBe("0");
  //
  //     await page.goto(testContext.getUrl("/stateful"));
  //     staticMessage = await page.$eval("#staticMessage", (el: any) => el.innerHTML);
  //     staticUpdateTime = await page.$eval("#staticUpdateTime", (el: any) => el.innerHTML);
  //     expect(staticMessage).toBe("hello from initialModelStaticState");
  //     expect(Number(staticUpdateTime)).toBeGreaterThan(0);
  //
  //     dynamicMessage = await page.$eval("#dynamicMessage", (el: any) => el.innerHTML);
  //     dynamicUpdateTime = await page.$eval("#dynamicUpdateTime", (el: any) => el.innerHTML);
  //     expect(dynamicMessage).toBe("hello from initialModelState");
  //     expect(Number(dynamicUpdateTime)).toBeGreaterThan(0);
  //   }, 999999);
  // });
});
