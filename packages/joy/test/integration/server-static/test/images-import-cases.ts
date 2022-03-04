import { JoyTestContext } from "../../../util/joy-test-context";
import "jest-playwright-preset";

export function imagesImportCases(testContext: JoyTestContext) {
  describe("images import", () => {
    test("import image form js", async () => {
      await page.goto(testContext.getUrl("/images-import"));

      const importImg = JSON.parse(await page.$eval("#importImg", (e: HTMLDivElement) => e.innerText));
      expect(importImg).toMatchObject({
        src: "/_joy/static/media/logo.64b6abdb.png",
        height: 192,
        width: 192,
        // blurDataURL: "/_joy/image?url=%2F_joy%2Fstatic%2Fmedia%2Flogo.64b6abdb.png&w=8&q=70",
      });
      if (testContext.dev) {
        expect(importImg.blurDataURL).toBe("/_joy/image?url=%2F_joy%2Fstatic%2Fmedia%2Flogo.64b6abdb.png&w=8&q=70");
      } else {
        expect(importImg.blurDataURL).toMatch(/^data:image\//);
      }
      expect(await page.$eval("#importImgSrc", (e) => getComputedStyle(e).width)).toBe("192px");
      expect(await page.$eval("#importImgBlur", (e) => getComputedStyle(e).width)).toBe("8px");

      const requireImg = JSON.parse(await page.$eval("#requireImg", (e: HTMLDivElement) => e.innerText));
      expect(requireImg).toMatchObject({
        src: "/_joy/static/media/logo.64b6abdb.png",
        height: 192,
        width: 192,
        // blurDataURL: "/_joy/image?url=%2F_joy%2Fstatic%2Fmedia%2Flogo.64b6abdb.png&w=8&q=70",
        default: {
          src: "/_joy/static/media/logo.64b6abdb.png",
          height: 192,
          width: 192,
          // blurDataURL: "/_joy/image?url=%2F_joy%2Fstatic%2Fmedia%2Flogo.64b6abdb.png&w=8&q=70",
        },
      });
    });
  });
}
