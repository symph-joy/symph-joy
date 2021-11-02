import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { staticCases } from "./static-cases";

describe("server-static prod", () => {
  const curPath = path.resolve(__dirname, "../");
  let testContext: JoyTestContext = new JoyTestContext(curPath);

  beforeAll(async () => {
    await testContext.start();
  }, 30000000);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("start", async () => {}, 999999999);

  describe("features", () => {
    staticCases(testContext);
  });
});
