import * as path from "path";
import { waitForMoment } from "../../../util/joy-test-utils";
import { JoyTestContext } from "../../../util/joy-test-context";
import { staticCases } from "./static-cases";
import { mvcCases } from "./mvc-cases";

describe("basic prod", () => {
  // jest.resetModules()
  const curPath = path.resolve(__dirname, "../");
  let testContext: JoyTestContext = new JoyTestContext(curPath);

  beforeAll(async () => {
    await testContext.start();
  }, 30000000);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("start", async () => {
    // await waitForMoment();
  }, 999999999);

  describe("features", () => {
    mvcCases(testContext);
    staticCases(testContext);
  });
});
