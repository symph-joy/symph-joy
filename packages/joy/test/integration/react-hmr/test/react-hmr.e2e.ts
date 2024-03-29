import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { pollGetText, waitFor } from "../../../util/joy-test-utils";
import { existsSync, mkdirpSync, readFileSync, rmSync, writeFileSync } from "fs-extra";

describe("react hmr", () => {
  let testContext: JoyTestContext;
  let ctlDir = path.join(__dirname, "../src/client/pages");
  let ctlFilePath = path.join(__dirname, "../src/client/pages/hello.controller.tsx");
  let ctlOriginSource = readFileSync(path.join(__dirname, "./hello.controller.tsx.tmp"), { encoding: "utf-8" });

  beforeAll(async () => {
    // clean
    if (existsSync(ctlDir)) {
      rmSync(ctlDir, { recursive: true });
    }
    mkdirpSync(ctlDir);
    // prepare
    writeFileSync(ctlFilePath, ctlOriginSource, { encoding: "utf-8" });

    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
    rmSync(ctlDir, { recursive: true });
  });

  test("Before modify file, Should response the origin content.", async () => {
    // await pollGetText(testContext.getUrl("/hello"), undefined, /\*message\*/);
    await page.goto(testContext.getUrl("/hello"));
    const msg = await page.$eval("#message", (el: any) => el.innerHTML);
    expect(msg).toContain("*message*");
  }, 60000);

  describe("modify file", () => {
    afterAll(async () => {
      writeFileSync(ctlFilePath, ctlOriginSource, { encoding: "utf-8" });
    });

    test("Modify file, then should reload server and response new content.", async () => {
      await page.goto(testContext.getUrl("/hello"));
      let msg = await page.$eval("#message", (el: any) => el.innerHTML);
      expect(msg).toContain("*message*");

      const updatedSource = ctlOriginSource.replace("*message*", "*modified*");
      writeFileSync(ctlFilePath, updatedSource, { encoding: "utf-8" });

      await page.waitForFunction(() => document?.getElementById("message")?.innerHTML === "*modified*");
      msg = await page.$eval("#message", (el: any) => el.innerHTML);
      expect(msg).toContain("*modified*");
    }, 60000);
  });

  describe("Add file", () => {
    let newCtlFilePath: string;
    beforeAll(async () => {
      newCtlFilePath = path.join(__dirname, "../src/client/pages/hello1.controller.tsx");
      let updatedSource = ctlOriginSource
        .replace("HelloController", "HelloController1")
        .replace('"/hello"', '"/hello1"')
        .replace("*message*", "*message1*");
      writeFileSync(newCtlFilePath, updatedSource, { encoding: "utf-8" });
    }, 60000);

    afterAll(async () => {
      rmSync(newCtlFilePath);
    });

    test("Add file, then should rend new page.", async () => {
      await pollGetText(testContext.getUrl("/hello1"), undefined, /\*message1\*/);
      await page.goto(testContext.getUrl("/hello1"));
      await page.waitForFunction(() => document?.getElementById("message")?.innerHTML === "*message1*", undefined, { timeout: 60000 });
      let msg = await page.$eval("#message", (el: any) => el.innerHTML);
      expect(msg).toContain("*message1*");
    }, 60000);
  });

  test("Delete file, then should render the 404 page.", async () => {
    let newCtlFilePath: string | undefined;
    try {
      // add
      newCtlFilePath = path.join(__dirname, "../src/client/pages/hello2.controller.tsx");
      let updatedSource = ctlOriginSource
        .replace("HelloController", "HelloController2")
        .replace("/hello", "/hello2")
        .replace("*message*", "*message2*");
      writeFileSync(newCtlFilePath, updatedSource, { encoding: "utf-8" });
      await pollGetText(testContext.getUrl("/hello2"), undefined, /\*message2\*/);
      await page.goto(testContext.getUrl("/hello2"));
      await page.waitForFunction(() => document?.getElementById("message")?.innerHTML === "*message2*", undefined, { timeout: 60000 });

      // then remove
      rmSync(newCtlFilePath);
      console.log("deleted file:,", newCtlFilePath);
      newCtlFilePath = undefined;
      await page.waitForFunction(() => document?.getElementById("__joy")?.innerHTML.includes("404"), undefined, { timeout: 500000 });
      await page.goto(testContext.getUrl("/hello2"));
    } finally {
      if (newCtlFilePath && existsSync(newCtlFilePath)) {
        rmSync(newCtlFilePath);
      }
    }
  }, 90000);
});
