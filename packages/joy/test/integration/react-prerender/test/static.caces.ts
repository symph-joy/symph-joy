import { promises } from "fs";
import { getDomInnerHtml } from "../../../util/html-utils";
import { ReactRouteInitStatus } from "@symph/react";
import { renderViaHTTP } from "../../../util/joy-test-utils";
import { JoyTestContext } from "../../../util/joy-test-context";
import { RouteSSGData } from "../../../../src/joy-server/lib/RouteSSGData.interface";

export function staticCases(testContext: JoyTestContext) {
  describe("static cases", () => {
    !testContext.dev &&
      test("build: should output static html and data json file", async () => {
        const staticOutputHtml = testContext.joyAppConfig.resolveSSGOutDir("./static.html");
        const htmlFileState = await promises.stat(staticOutputHtml);
        expect(htmlFileState.isFile()).toBe(true);
        const fileContext = await promises.readFile(staticOutputHtml, {
          encoding: "utf-8",
        });
        expect(fileContext.indexOf("this is a static route page") > 0).toBe(true);

        const staticOutputData = testContext.joyAppConfig.resolveSSGOutDir("./static.json");
        const dataFileState = await promises.stat(staticOutputData);
        expect(dataFileState.isFile()).toBe(true);
      });

    /**
     * 如果在压缩混淆是改变了类名， 将会导致自动生成providerId时，使用混淆后的类名。
     */
    !testContext.dev &&
      test("build: should keep class name of controller when code has be compressed.", async () => {
        const staticOutput = testContext.joyAppConfig.resolveSSGOutDir("./static.html");
        const fileContext = await promises.readFile(staticOutput, {
          encoding: "utf-8",
        });
        const ctlClassName = getDomInnerHtml(fileContext, "#ctlClassName");
        expect(ctlClassName).toBe("StaticCtl");
      });

    !testContext.dev &&
      test("build: Should set page init state, initState=SUCCESS.", async () => {
        const filePath = testContext.joyAppConfig.resolveSSGOutDir("./static.json");
        const fileContext = await promises.readFile(filePath, {
          encoding: "utf-8",
        });
        const date = JSON.parse(fileContext) as RouteSSGData[];
        console.log(date);
        const setStateAction = date.find((it) => it.pathname === "/static")?.ssgData?.find((it) => it.type === "reactAppInitManager/__SET_STATE");
        expect(setStateAction).toBeTruthy();
        expect(setStateAction).toHaveProperty("state./static.initStatic", ReactRouteInitStatus.SUCCESS);
        expect(setStateAction).toHaveProperty("state./static.init", undefined);
      }, 999999);

    !testContext.dev &&
      test("build: should response the static html file，which was prerendered out during ssg.", async () => {
        const staticOutput = testContext.joyAppConfig.resolveSSGOutDir("./static.html");
        const fileContext = await promises.readFile(staticOutput, {
          encoding: "utf-8",
        });
        const matched = fileContext.match(/timestamp:(?:<!-- -->)?([\d]+)/);
        expect(matched).toBeTruthy();
        const prerenderTs = matched![1];

        const resContext = await renderViaHTTP(testContext.port, "/static");
        const resMatched = resContext.match(/timestamp:(?:<!-- -->)?([\d]+)/);
        expect(resMatched).toBeTruthy();
        const resTs = resMatched![1];
        expect(resTs).toBe(prerenderTs);
      }, 999999);
  });
}
