import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { mvcCases } from "./mvc-cases";
import {waitForMoment} from "../../../util/joy-test-utils";

describe("react-mvc dev", () => {
  // jest.resetModules()
  const curPath = path.resolve(__dirname, "../");
  let testContext: JoyTestContext = new JoyTestContext(curPath);

  beforeAll(async () => {
    await testContext.startDev();
  }, 30000000);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("start", async () => {
    // await waitForMoment();
  }, 999999999);

  describe("features", () => {
    mvcCases(testContext);
  });
});
