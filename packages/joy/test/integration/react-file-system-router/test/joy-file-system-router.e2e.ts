import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { waitFor } from "../../../util/joy-test-utils";

describe("joy file system router", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("render the root route.", async () => {
    // await waitForMoment()
    await page.goto(testContext.getUrl("/"));
  }, 999999);

  test("render the default index route", async () => {
    await page.goto(testContext.getUrl("/blog"));
    const main = await page.$eval("#layout", (el: any) => el.innerHTML);
    const index = await page.$eval("#index", (el: any) => el.innerHTML);
    expect(main).toBe("Blog Main Layout");
    expect(index).toBe("Blog Index");
  }, 999999);

  test("render the specified constant path route", async () => {
    await page.goto(testContext.getUrl("/blog/about"));
    const main = await page.$eval("#layout", (el: any) => el.innerHTML);
    const about = await page.$eval("#about", (el: any) => el.innerHTML);
    expect(main).toBe("Blog Main Layout");
    expect(about).toBe("Blog About");
  }, 999999);

  test("render the dynamic route", async () => {
    await page.goto(testContext.getUrl("/blog/post/1"));
    const main = await page.$eval("#layout", (el: any) => el.innerHTML);
    const post = await page.$eval("#post", (el: any) => el.innerHTML);
    expect(main).toBe("Blog Main Layout");
    expect(post).toBe("Post 1");
  }, 999999);

  test("render the dynamic route, and its child route.", async () => {
    await page.goto(testContext.getUrl("/blog/post/2/comments"));
    const main = await page.$eval("#layout", (el: any) => el.innerHTML);
    const postTitle = await page.$eval("#postTitle", (el: any) => el.innerHTML);
    const postComments = await page.$eval("#postComments", (el: any) => el.innerHTML);
    expect(main).toBe("Blog Main Layout");
    expect(postTitle).toBe("Post 2");
    expect(postComments).toBe("Post Comments");
  }, 999999);
});
