import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { promises } from "fs";
import { waitFor } from "../../../util/joy-test-utils";
import { getDomInnerHtml } from "../../../util/html-utils";
import { RouteSSGData } from "../../../../src/joy-server/lib/RouteSSGData.interface";

describe("prerender-with-api", () => {
  let testContext: JoyTestContext;
  beforeAll(async () => {
    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createServerContext(curPath);
  }, 3000000);

  afterAll(async () => {
    await testContext.killServer();
  });

  test("should render page, which the data is fetched from server api.", async () => {
    // await waitForMoment()
    const staticOutputHtml = testContext.joyAppConfig.resolveSSGOutDir("./entity/1.html");
    const htmlFileState = await promises.stat(staticOutputHtml);
    expect(htmlFileState.isFile()).toBe(true);
    const fileContext = await promises.readFile(staticOutputHtml, {
      encoding: "utf-8",
    });
    expect(getDomInnerHtml(fileContext, "#msg")).toBe("Hello 1.");

    const staticOutputData = testContext.joyAppConfig.resolveSSGOutDir("./entity/1.json");
    const dataFileState = await promises.stat(staticOutputData);
    expect(dataFileState.isFile()).toBe(true);
    const jsonContext = await promises.readFile(staticOutputData, {
      encoding: "utf-8",
    });
    const jsonObj = JSON.parse(jsonContext) as RouteSSGData[];
    expect(jsonObj.find((it) => it.pathname === "/entity/1")?.ssgData.find((it: any) => it.type === "entityModel/__SET_STATE")).toHaveProperty(
      "state.showEntity.msg",
      "Hello 1."
    );
  });
});
