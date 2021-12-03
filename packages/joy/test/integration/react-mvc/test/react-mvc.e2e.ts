import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { mvcCases } from "./mvc-cases";
import { waitForMoment } from "../../../util/joy-test-utils";

describe("react-mvc", () => {
  describe("dev", () => {
    // jest.resetModules()
    const curPath = path.resolve(__dirname, "../");
    let testContext: JoyTestContext = new JoyTestContext(curPath);

    beforeAll(async () => {
      await testContext.startDev();
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    test("start", async () => {
      // await waitForMoment();
    }, 999999);

    describe("features", () => {
      mvcCases(testContext);
    });
  });

  describe("prod", () => {
    // jest.resetModules()
    const curPath = path.resolve(__dirname, "../");
    let testContext: JoyTestContext = new JoyTestContext(curPath);

    beforeAll(async () => {
      await testContext.start();
    }, 999999);

    afterAll(async () => {
      await testContext.killServer();
    });

    test("start", async () => {
      // await waitForMoment();
    }, 999999);

    describe("features", () => {
      mvcCases(testContext);
    });
  });
});
