import "jest-playwright-preset";
import * as path from "path";
import { JoyTestContext } from "../../../util/joy-test-context";
import { join } from "path";
import fs from "fs-extra";
import {
  joyBuild,
  renderViaHTTP,
  waitForMoment,
} from "../../../util/joy-test-utils";
import { promises } from "fs";
import { json, response } from "express";
import hello from "../../../../src/pages/hello";

function getDomInnerHtml(
  html: string,
  id: string,
  domType = "div"
): string | undefined {
  if (!html) {
    return undefined;
  }
  const regDiv = new RegExp(
    `<${domType} [\\s\\S]*?id=['"]${id}['"][\\s\\S]*?>([\\s\\S]*?)</${domType}>`
  );
  const matched = html.match(regDiv);
  if (matched) {
    return matched[1];
  }
  return undefined;
}

describe("prerender", () => {
  let testContext: JoyTestContext;

  beforeAll(async () => {
    const appDir = path.resolve(__dirname, "../");
    // await fs.remove(join(appDir, '.joy'))
    testContext = await JoyTestContext.createServerContext(appDir);
    // testContext = await JoyTestContext.createDevServerContext(appDir);
    console.log(">>> build completed:");
  }, 3000000);

  afterAll(async () => {
    await testContext.killServer();
    console.log(">>>>> server close");
  });

  // test("prerender run start", async () => {
  //   const buildOutput = testContext?.buildState?.stdout;
  //   console.log(">>> buildOutput:", buildOutput);
  //   await waitForMoment();
  // }, 9999999);

  describe("static page", () => {
    test("should output static html and data json file", async () => {
      const staticOutputHtml = testContext.joyAppConfig.resolveSSGOutDir(
        "./static.html"
      );
      const htmlFileState = await promises.stat(staticOutputHtml);
      expect(htmlFileState.isFile()).toBe(true);
      const fileContext = await promises.readFile(staticOutputHtml, {
        encoding: "utf-8",
      });
      expect(fileContext.indexOf("this is a static route page") > 0).toBe(true);

      const staticOutputData = testContext.joyAppConfig.resolveSSGOutDir(
        "./static.json"
      );
      const dataFileState = await promises.stat(staticOutputData);
      expect(dataFileState.isFile()).toBe(true);
    });

    /**
     * 如果在压缩混淆是改变了类名， 将会导致自动生成providerId时，使用混淆后的类名。
     */
    test("should keep class name of controller when tenser js code.", async () => {
      const staticOutput = testContext.joyAppConfig.resolveSSGOutDir(
        "./static.html"
      );
      const fileContext = await promises.readFile(staticOutput, {
        encoding: "utf-8",
      });
      const ctlClassName = getDomInnerHtml(fileContext, "ctlClassName", "span");
      expect(ctlClassName).toBe("StaticCtl");
    });

    test("should response the static html file，which was prerendered out during ssg.", async () => {
      const staticOutput = testContext.joyAppConfig.resolveSSGOutDir(
        "./static.html"
      );
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
    }, 1111111111);
  });

  describe("stateful page", () => {
    test("should only init static state during ssg, and then init dynamic state in browser.", async () => {
      const staticOutput = testContext.joyAppConfig.resolveSSGOutDir(
        "./stateful.html"
      );
      const fileContext = await promises.readFile(staticOutput, {
        encoding: "utf-8",
      });

      const ssgStaticMessage = getDomInnerHtml(fileContext, "staticMessage");
      const ssgStaticUpdateTime = getDomInnerHtml(
        fileContext,
        "staticUpdateTime"
      );
      const ssgDynamicMessage = getDomInnerHtml(fileContext, "dynamicMessage");
      const ssgDynamicUpdateTime = getDomInnerHtml(
        fileContext,
        "dynamicUpdateTime"
      );
      expect(ssgStaticMessage).toBe("hello from initialModelStaticState");
      expect(ssgDynamicMessage).toBe("init dynamic message");
      expect(Number(ssgStaticUpdateTime) > 0).toBeTruthy();
      expect(Number(ssgDynamicUpdateTime) === 0).toBeTruthy();

      await page.goto(testContext.getUrl("/stateful"));
      const browserStaticMessage = await page.$eval(
        "#staticMessage",
        (el: any) => el.innerHTML
      );
      const browserStaticUpdateTime = await page.$eval(
        "#staticUpdateTime",
        (el: any) => el.innerHTML
      );
      const browserDynamicMessage = await page.$eval(
        "#dynamicMessage",
        (el: any) => el.innerHTML
      );
      const browserDynamicUpdateTime = await page.$eval(
        "#dynamicUpdateTime",
        (el: any) => el.innerHTML
      );
      expect(browserStaticMessage).toBe("hello from initialModelStaticState");
      expect(browserDynamicMessage).toBe("hello from initialModelState");
      // browser should not execute initStaticModelState, so the updateTime should not changed
      expect(ssgStaticUpdateTime).toBe(browserStaticUpdateTime);
      expect(Number(browserDynamicUpdateTime) > 0).toBeTruthy();
    }, 1111111111);

    test("should container route info in _ssgManifest.js file.", async () => {
      // _ssgManifest.js 文件在浏览器上用于标识已经ssg的路由，可以直接获取并使用route的data文件，不用再执行路由controller的initStaticModelState()方法.
      const staticOutput = testContext.joyAppConfig.resolveBuildOutDir(
        `./static/${testContext.getBuildId()}/_ssgManifest.js`
      );
      const fileContext = await promises.readFile(staticOutput, {
        encoding: "utf-8",
      });
      expect(fileContext).toContain("\\u002Fstateful");
    });

    test("should fetch data.json file when go into a ssg route, and then merge data into browser store， instead of invoke initStaticModelState method.", async () => {
      await page.goto(testContext.getUrl("/links"));
      page.click("#stateful");
      const res = await page.waitForResponse((response) =>
        response.url().includes("/stateful.json")
      );
      const data = (await res.json()) as Array<any>;
      // 是否正常返回了数据
      expect(data).toBeTruthy();
      const setStateAction = data.find(
        (it) => it.type === "statefulModel/__SET_STATE"
      );
      // 必须包含初始化static state的后生成的数据。
      expect(setStateAction).toHaveProperty(
        "nextState.staticMessage",
        "hello from initialModelStaticState"
      );
      const staticUpdateTime = setStateAction.nextState.staticUpdateTime;
      await page.waitForFunction(
        () =>
          document?.querySelector("#staticMessage")?.innerHTML ===
          "hello from initialModelStaticState"
      );
      const browserStaticUpdateTime = await page.$eval(
        "#staticUpdateTime",
        (el: any) => el.innerHTML
      );
      // 界面上应该展示的是服务端返回的数据，浏览器上不应该在执行初始化initStaticState流程。
      expect(String(staticUpdateTime)).toBe(browserStaticUpdateTime);
    });
  });

  describe("dynamic route", () => {
    test("should export out static file, which url path was specified in static path generator", async () => {
      async function checkOutputFile(path: string, checkText: string) {
        const hello1OutputHtml = testContext.joyAppConfig.resolveSSGOutDir(
          `${path}.html`
        );
        const htmlFileState = await promises.stat(hello1OutputHtml);
        expect(htmlFileState.isFile()).toBe(true);
        const fileContext = await promises.readFile(hello1OutputHtml, {
          encoding: "utf-8",
        });
        const msg = getDomInnerHtml(fileContext, "msg", "span");
        expect(msg).toBe(checkText);

        const staticOutputData = testContext.joyAppConfig.resolveSSGOutDir(
          `${path}.json`
        );
        const dataFileState = await promises.stat(staticOutputData);
        expect(dataFileState.isFile()).toBe(true);
      }

      await checkOutputFile("./dynamic/hello1", "hello1");
      await checkOutputFile("./dynamic/hello2", "hello2");
    });

    test("should fetch data.json, when when the path has been ssg", async () => {
      await page.goto(testContext.getUrl("/links"));
      page.click("#dynamic-hello1");
      const res = await page.waitForResponse((response) =>
        response.url().includes("/dynamic/hello1.json")
      );
      const data = (await res.json()) as Array<any>;
      // 是否正常返回了数据
      expect(data?.length).toBeTruthy();
    });
  });

  describe("revalidate", () => {
    test("should export out initialRevalidateSeconds", async () => {
      const filePath = testContext.joyAppConfig.resolveBuildOutDir(
        "prerender-manifest.json"
      );
      const fileContext = await promises.readFile(filePath, {
        encoding: "utf-8",
      });
      const manifest = JSON.parse(fileContext);
      const route = manifest.routes["/revalidate"];
      expect(route).toBeTruthy();
      expect(route.initialRevalidateSeconds).toBe(1);
    });

    test("should has Cache-Control in http response header", async () => {
      page.goto(testContext.getUrl("/revalidate"));
      const res = await page.waitForResponse((response) =>
        response.url().includes("/revalidate")
      );
      const header = await res.headers();
      // 是否正常返回了数据
      expect(header["cache-control"]).toBe(
        "s-maxage=1, stale-while-revalidate"
      );
    });
  });
});
