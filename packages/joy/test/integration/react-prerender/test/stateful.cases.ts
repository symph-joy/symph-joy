import { promises } from "fs";
import { getDomInnerHtml } from "../../../util/html-utils";
import { JoyTestContext } from "../../../util/joy-test-context";
import { fetchViaHTTP, renderViaHTTP } from "../../../util/joy-test-utils";
export function statefulCases(testContext: JoyTestContext) {
  describe("stateful cases", () => {
    !testContext.dev &&
      test("build: should only init static state during ssg, and then init dynamic state in browser.", async () => {
        const staticOutput = testContext.joyAppConfig.resolveSSGOutDir("./stateful.html");
        const fileContext = await promises.readFile(staticOutput, {
          encoding: "utf-8",
        });

        const ssgStaticMessage = getDomInnerHtml(fileContext, "#staticMessage");
        const ssgStaticUpdateTime = getDomInnerHtml(fileContext, "#staticUpdateTime");
        const ssgDynamicMessage = getDomInnerHtml(fileContext, "#dynamicMessage");
        const ssgDynamicUpdateTime = getDomInnerHtml(fileContext, "#dynamicUpdateTime");
        expect(ssgStaticMessage).toBe("hello from initialModelStaticState");
        expect(ssgDynamicMessage).toBe("init dynamic message");
        expect(Number(ssgStaticUpdateTime) > 0).toBeTruthy();
        expect(Number(ssgDynamicUpdateTime) === 0).toBeTruthy();

        await page.goto(testContext.getUrl("/stateful"), { waitUntil: "load", timeout: 50000 });
        const browserStaticMessage = await page.$eval("#staticMessage", (el: any) => el.innerHTML);
        const browserStaticUpdateTime = await page.$eval("#staticUpdateTime", (el: any) => el.innerHTML);
        const browserDynamicMessage = await page.$eval("#dynamicMessage", (el: any) => el.innerHTML);
        const browserDynamicUpdateTime = await page.$eval("#dynamicUpdateTime", (el: any) => el.innerHTML);
        expect(browserStaticMessage).toBe("hello from initialModelStaticState");
        expect(browserDynamicMessage).toBe("hello from initialModelState");
        // browser should not execute initStaticModelState, so the updateTime should not changed
        expect(ssgStaticUpdateTime).toBe(browserStaticUpdateTime);
        expect(Number(browserDynamicUpdateTime) > 0).toBeTruthy();
      }, 999999);

    testContext.dev &&
      test("dev: should only init static state on server, and then init dynamic state on browser.", async () => {
        const [htmlContext] = await Promise.all([
          page.waitForResponse((res) => res.url().includes("/stateful")).then((res) => res.text()),
          page.goto(testContext.getUrl("/stateful"), { waitUntil: "load", timeout: 50000 }),
        ]);
        const ssgStaticMessage = getDomInnerHtml(htmlContext, "#staticMessage");
        const ssgStaticUpdateTime = getDomInnerHtml(htmlContext, "#staticUpdateTime");
        const ssgDynamicMessage = getDomInnerHtml(htmlContext, "#dynamicMessage");
        const ssgDynamicUpdateTime = getDomInnerHtml(htmlContext, "#dynamicUpdateTime");
        expect(ssgStaticMessage).toBe("hello from initialModelStaticState");
        expect(ssgDynamicMessage).toBe("init dynamic message");
        expect(Number(ssgStaticUpdateTime) > 0).toBeTruthy();
        expect(Number(ssgDynamicUpdateTime) === 0).toBeTruthy();

        const browserStaticMessage = await page.$eval("#staticMessage", (el: any) => el.innerHTML);
        const browserStaticUpdateTime = await page.$eval("#staticUpdateTime", (el: any) => el.innerHTML);
        const browserDynamicMessage = await page.$eval("#dynamicMessage", (el: any) => el.innerHTML);
        const browserDynamicUpdateTime = await page.$eval("#dynamicUpdateTime", (el: any) => el.innerHTML);
        expect(browserStaticMessage).toBe("hello from initialModelStaticState");
        expect(browserDynamicMessage).toBe("hello from initialModelState");
        // browser should not execute initStaticModelState, so the updateTime should not changed
        expect(ssgStaticUpdateTime).toBe(browserStaticUpdateTime);
        expect(Number(browserDynamicUpdateTime) > 0).toBeTruthy();
      }, 999999);

    test("should container route info in _ssgManifest.js file.", async () => {
      // _ssgManifest.js 文件在浏览器上用于标识已经ssg的路由，可以直接获取并使用route的data文件，不用再执行路由controller的initStaticModelState()方法.
      const staticOutput = testContext.joyAppConfig.resolveBuildOutDir(`./react/static/${testContext.getBuildId()}/_ssgManifest.js`);
      const fileContext = await promises.readFile(staticOutput, {
        encoding: "utf-8",
      });
      if (testContext.dev) {
        expect(fileContext).toContain("new Set;");
      } else {
        expect(fileContext).toContain("\\u002Fstateful");
      }
    });

    test("should fetch data.json file when go into a ssg route, and then merge data into browser store， instead of invoke initStaticModelState method.", async () => {
      await page.goto(testContext.getUrl("/links"));
      const [res] = await Promise.all([page.waitForResponse((response) => response.url().includes("/stateful.json")), page.click("#stateful")]);
      const data = (await res.json()) as Array<any>;
      // 是否正常返回了数据
      expect(data).toBeTruthy();
      const setStateAction = data.find((it) => it.pathname === "/stateful").ssgData.find((it: any) => it.type === "statefulModel/__SET_STATE");
      // 必须包含初始化static state的后生成的数据。
      expect(setStateAction).toHaveProperty("state.staticMessage", "hello from initialModelStaticState");
      const staticUpdateTime = setStateAction.state.staticUpdateTime;
      await page.waitForFunction(() => document?.querySelector("#staticMessage")?.innerHTML === "hello from initialModelStaticState");
      const browserStaticUpdateTime = await page.$eval("#staticUpdateTime", (el: any) => el.innerHTML);
      // 界面上应该展示的是服务端返回的数据，浏览器上不应该在执行初始化initStaticState流程。
      expect(String(staticUpdateTime)).toBe(browserStaticUpdateTime);
    });
  });
}
