import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitFor } from "../../../util/joy-test-utils";

describe("joy router", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("render the index route", async () => {
    // waitForMoment()
    await page.goto(testContext.getUrl("/blog"));
    const main = await page.$eval("#main", (el: any) => el.innerHTML);
    const index = await page.$eval("#index", (el: any) => el.innerHTML);
    expect(main).toBe("Blog Main Layout");
    expect(index).toBe("Blog Index");
  }, 999999);

  test("render the specified constant path route", async () => {
    await page.goto(testContext.getUrl("/blog/about"));
    const main = await page.$eval("#main", (el: any) => el.innerHTML);
    const about = await page.$eval("#about", (el: any) => el.innerHTML);
    expect(main).toBe("Blog Main Layout");
    expect(about).toBe("Blog About");
  }, 999999);
});
