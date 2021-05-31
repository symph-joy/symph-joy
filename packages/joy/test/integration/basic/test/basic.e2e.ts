import * as path from "path";
import { waitForMoment } from "../../../util/joy-test-utils";
import { JoyTestContext } from "../../../util/joy-test-context";

describe("basic", () => {
  let start: number;
  let testContext: JoyTestContext;
  beforeAll(async () => {
    // jest.resetModules()
    start = Date.now();
    console.log(">>>>> start dev server", start);
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
    console.log(">>>>> server prepared", testContext.port, Date.now() - start);
  }, 30000000);

  afterAll(async () => {
    await testContext.killServer();
    console.log(">>>>> server close", Date.now() - start);
  });

  test("start", async () => {
    // await waitForMoment();
  }, 999999999);
});
