import * as path from "path";
import "jest-playwright-preset";
import { JoyTestContext } from "../../../util/joy-test-context";
import { pollGetText, waitFor } from "../../../util/joy-test-utils";
import got from "got";
import { rmdirSync, rmSync, writeFileSync, mkdirp, mkdirpSync, existsSync, readFileSync } from "fs-extra";

describe("server hmr", () => {
  let testContext: JoyTestContext;
  let ctlDir = path.join(__dirname, "../src/server/controller");
  let ctlFilePath = path.join(__dirname, "../src/server/controller/hello.controller.ts");
  let ctlOriginSource = readFileSync(path.join(__dirname, "./hello.controller.ts.tmp"), { encoding: "utf-8" });

  beforeAll(async () => {
    // clean
    if (existsSync(ctlDir)) {
      rmdirSync(ctlDir, { recursive: true });
    }
    mkdirpSync(ctlDir);
    // prepare
    writeFileSync(ctlFilePath, ctlOriginSource, { encoding: "utf-8" });

    const curPath = path.resolve(__dirname, "../");
    testContext = await JoyTestContext.createDevServerContext(curPath);
  }, 999999);

  afterAll(async () => {
    await testContext.killServer();
    rmdirSync(ctlDir, { recursive: true });
  });

  test("Before modify file, Should response the origin content.", async () => {
    const response = await got.get(testContext.getUrl("/api/hello"), {
      throwHttpErrors: false,
      responseType: "text",
    });
    expect(response.body.trim()).toBe("Hello {{message}}");
  }, 999999);

  describe("modify file", () => {
    beforeAll(async () => {
      const updatedSource = ctlOriginSource.replace("{{message}}", "{{modified}}");
      writeFileSync(ctlFilePath, updatedSource, { encoding: "utf-8" });
    }, 999999);

    afterAll(async () => {
      writeFileSync(ctlFilePath, ctlOriginSource, { encoding: "utf-8" });
    });

    test("Modify file, then should reload server and response new content.", async () => {
      // await waitForMoment();
      const resBody = await pollGetText(testContext.getUrl("/api/hello"), undefined, /{{modified}}/);
      expect(resBody).toBe("Hello {{modified}}");
    }, 999999);
  });

  describe("Add file", () => {
    let newCtlFilePath: string;
    beforeAll(async () => {
      newCtlFilePath = path.join(__dirname, "../src/server/controller/hello1.controller.ts");
      let updatedSource = ctlOriginSource
        .replace("HelloController", "HelloController1")
        .replace('"/hello"', '"/hello1"')
        .replace("{{message}}", "{{message1}}");
      writeFileSync(newCtlFilePath, updatedSource, { encoding: "utf-8" });
    }, 999999);

    afterAll(async () => {
      rmSync(newCtlFilePath);
    });

    test("Add file, then should reload server and response new file content.", async () => {
      const resBody = await pollGetText(testContext.getUrl("/api/hello1"), undefined, /{{message1}}/);
      expect(resBody).toBe("Hello {{message1}}");
    }, 999999);
  });

  test("Delete file, then should not response the old content.", async () => {
    let newCtlFilePath: string | undefined;
    try {
      // add
      newCtlFilePath = path.join(__dirname, "../src/server/controller/hello2.controller.ts");
      let updatedSource = ctlOriginSource
        .replace("HelloController", "HelloController2")
        .replace('"/hello"', '"/hello2"')
        .replace("{{message}}", "{{message2}}");
      writeFileSync(newCtlFilePath, updatedSource, { encoding: "utf-8" });
      const resBody = await pollGetText(testContext.getUrl("/api/hello2"), undefined, /{{message2}}/);
      expect(resBody).toBe("Hello {{message2}}");
      console.log("after add response body:,", resBody);

      // then remove
      rmSync(newCtlFilePath);
      console.log("deleted file:,", newCtlFilePath);
      newCtlFilePath = undefined;
      const delBody = await pollGetText(testContext.getUrl("/api/hello2"), undefined, /404/);
      expect(delBody).toContain("404");
    } finally {
      if (newCtlFilePath && existsSync(newCtlFilePath)) {
        rmSync(newCtlFilePath);
      }
    }
  }, 999999);
});
