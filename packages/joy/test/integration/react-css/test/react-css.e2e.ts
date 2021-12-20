import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitFor } from "../../../util/joy-test-utils";
import { Page } from "playwright-core";

describe("react-css", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
    // await waitForMoment()
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  async function checkStyles(page: Page) {
    const cssStyleColor = await page.$eval("#cssStyle", (e: any) => getComputedStyle(e).color);
    expect(cssStyleColor).toBe("rgb(255, 0, 0)");

    const lessStyleColor = await page.$eval("#lessStyle", (e: any) => getComputedStyle(e).color);
    expect(lessStyleColor).toBe("rgb(0, 0, 255)");

    const scssStyleColor = await page.$eval("#scssStyle", (e: any) => getComputedStyle(e).color);
    expect(scssStyleColor).toBe("rgb(0, 128, 0)");

    const sassStyleColor = await page.$eval("#sassStyle", (e: any) => getComputedStyle(e).color);
    expect(sassStyleColor).toBe("rgb(0, 255, 0)");
  }

  test("should render with global css|less|sass style", async () => {
    await page.goto(testContext.getUrl("/global"));
    await checkStyles(page);
  }, 999999);

  test("should render with module css|less|sass style", async () => {
    await page.goto(testContext.getUrl("/modules"));
    await checkStyles(page);
  }, 999999);

  test("should render with sass variables export.", async () => {
    await page.goto(testContext.getUrl("/sass-variables"));
    const scssStyleColor = await page.$eval("#sassVariable", (e: any) => getComputedStyle(e).color);
    expect(scssStyleColor).toBe("rgb(255, 0, 0)");
  });

  test("should render with convention global.css style", async () => {
    await page.goto(testContext.getUrl("/"));
    const scssStyleColor = await page.$eval("#globalStyle", (e: any) => getComputedStyle(e).fontSize);
    expect(scssStyleColor).toBe("20px");
  }, 999999);
});
