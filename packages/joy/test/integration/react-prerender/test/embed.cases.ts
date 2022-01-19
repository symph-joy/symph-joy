import { JoyTestContext } from "../../../util/joy-test-context";
import cheerio from "cheerio";
import { RouteSSGData } from "../../../../src/joy-server/lib/RouteSSGData.interface";

export function embedCases(testContext: JoyTestContext) {
  describe("embed cases", () => {
    testContext.dev &&
      test("Should render page with embed route.", async () => {
        const [htmlContext] = await Promise.all([
          page.waitForResponse((res) => res.url().includes("/embed/parent/child")).then((res) => res.text()),
          page.goto(testContext.getUrl("/embed/parent/child"), { waitUntil: "load", timeout: 50000 }),
        ]);
        const $ = cheerio.load(htmlContext);
        const parentMsg = $("#parentMsg").html();
        const childMsg = $("#childMsg").html();
        expect(parentMsg).toBe("hello from parent initialModelStaticState");
        expect(childMsg).toBe("hello from child initialModelStaticState");

        const browserParentMsg = await page.$eval("#parentMsg", (el: any) => el.innerHTML);
        const browserChildMsg = await page.$eval("#childMsg", (el: any) => el.innerHTML);
        expect(browserParentMsg).toBe("hello from parent initialModelState");
        expect(browserChildMsg).toBe("hello from child initialModelState");
      }, 999999);

    test("Should fetch embed route ssg data", async () => {
      await page.goto(testContext.getUrl("/links"));
      const [res] = await Promise.all([
        page.waitForResponse((response) => response.url().includes("/embed/parent/child.json")),
        page.click("#embed"),
      ]);
      const data = (await res.json()) as RouteSSGData[];

      const parentRouteSSGData = data.find((it) => it.pathname === "/embed/parent");
      expect(parentRouteSSGData?.ssgData?.find((it) => it.type === "embedParentModel/__SET_STATE")).toMatchObject({
        state: { msg: "hello from parent initialModelStaticState" },
      });
      const childRouteSSGData = data.find((it) => it.pathname === "/embed/parent/child");
      expect(childRouteSSGData?.ssgData?.find((it) => it.type === "embedChildModel/__SET_STATE")).toMatchObject({
        state: { msg: "hello from child initialModelStaticState" },
      });
    }, 999999);
  });
}
