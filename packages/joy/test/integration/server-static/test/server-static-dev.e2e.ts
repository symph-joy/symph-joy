import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { staticCases } from "./static-cases";

describe("server-static dev", () => {
  const curPath = path.resolve(__dirname, "../");
  let testContext: JoyTestContext = new JoyTestContext(curPath);

  beforeAll(async () => {
    await testContext.startDev();
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("start", async () => {}, 999999);

  describe("features", () => {
    staticCases(testContext);
  });
});
