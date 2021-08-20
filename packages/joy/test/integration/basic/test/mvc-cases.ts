import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { fetchViaHTTP } from "../../../util/joy-test-utils";
import { getDomInnerHtml } from "../../../util/html-utils";

export function mvcCases(testContext: JoyTestContext) {
  describe("mvc", () => {
    test("should response the basic mvc page.", async () => {
      const res = await fetchViaHTTP(testContext.port, "/basic-mvc");
      expect(res.status).toBe(200);
      const htmlContent = await res.text();
      const message = getDomInnerHtml(htmlContent, "message", "span");
      const count = getDomInnerHtml(htmlContent, "count", "span");
      expect(message).toBe("hello joy");
      expect(count).toBe("1");
    });

    test("should render the basic mvc page.", async () => {
      await page.goto(testContext.getUrl("/basic-mvc"));
      const message = await page.innerText("#message");
      const count = await page.innerText("#count");
      expect(message).toBe("hello joy");
      expect(count).toBe("1");
    });

    test("mvc components should work well on browser.", async () => {
      await page.goto(testContext.getUrl("/basic-mvc"));
      await page.click("#btnAdd");
      const count = await page.innerText("#count");
      expect(count).toBe("2");
    });
  });
}
