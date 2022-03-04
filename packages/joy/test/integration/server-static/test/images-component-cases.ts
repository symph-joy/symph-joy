import { JoyTestContext } from "../../../util/joy-test-context";
import "jest-playwright-preset";

export function imagesComponentCases(testContext: JoyTestContext) {
  describe("images component", () => {
    test("display image by <Image>", async () => {
      await page.goto(testContext.getUrl("/images-component"));

      expect(await page.$eval("#compImg", (e) => getComputedStyle(e).width)).toBe("192px");
    });
  });
}
``;
