import * as path from "path";
import { waitForMoment } from "../../../util/joy-test-utils";
import { JoyTestContext } from "../../../util/joy-test-context";

describe("basic joy dev", () => {
  let start: number;
  let testContext: JoyTestContext;
  beforeAll(async () => {
    // jest.resetModules()
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

  test("basic should start dev", async () => {
    // await waitForMoment();
    // await page.goto(host);
  }, 999999);
});
