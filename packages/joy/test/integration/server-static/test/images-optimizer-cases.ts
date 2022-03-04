import { JoyTestContext } from "../../../util/joy-test-context";
import "jest-playwright-preset";
import got from "got";

export function imagesOptimizerCases(testContext: JoyTestContext) {
  describe("images optimizer", () => {
    test("Should load optimized image.", async () => {
      const res = await got.get(testContext.getUrl("/_joy/image?url=%2F_joy%2Fstatic%2Fmedia%2Flogo.64b6abdb.png&w=32&q=75"), {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        },
      });
      expect(res.headers["content-type"]).toBe("image/webp");
      expect(res.headers["etag"]).toBeTruthy();
      expect(res.headers["content-security-policy"]).toContain("script-src 'none'");
    });

    test("Should display a series of size of image.", async () => {
      await page.goto(testContext.getUrl("/images-optimizer"));
      if (testContext.dev) {
        expect(await page.$eval("#size8", (e) => getComputedStyle(e).width)).toBe("8px");
      } else {
        // 生产环境下运行，不会生产8像素的图片，加载识别后展示浏览器默认的16px占位图。
        expect(await page.$eval("#size8", (e) => getComputedStyle(e).width)).toBe("16px");
      }

      expect(await page.$eval("#size32", (e) => getComputedStyle(e).width)).toBe("32px");
      expect(await page.$eval("#size256", (e) => getComputedStyle(e).width)).toBe("256px");
    });
  });
}
