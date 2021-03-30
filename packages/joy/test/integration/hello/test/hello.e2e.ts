import * as path from "path";
import { killApp } from "../../../util/joy-test-utils";
import { JoyTestContext } from "../../../util/joy-test-context";

describe("hello joy dev", () => {
  let start: number;
  let testContext: JoyTestContext;
  beforeAll(async () => {
    start = Date.now();
    console.log(">>>>> start dev server", start);
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createContext(curPath);
    console.log(">>>>> server prepared", testContext.port, Date.now() - start);
  }, 30000);

  afterAll(async () => {
    await testContext.killServer();
    console.log(">>>>> server close", Date.now() - start);
  });

  test("hello should start dev", async () => {
    await page.goto(testContext.getUrl("/"));
    const browser = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(browser).toContain("Welcome to Joy!");
  });
});
