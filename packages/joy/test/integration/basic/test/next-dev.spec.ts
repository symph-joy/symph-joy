import "reflect-metadata";
import * as path from "path";

import {
  fetchViaHTTP,
  findPort,
  launchApp,
  renderViaHTTP,
  waitForMoment,
} from "../../../util/client-utils";
// import {Simulate} from "react-dom/test-utils";
// import keyDown = Simulate.keyDown;
import { JoyBoot } from "@symph/joy/src/joy-boot";
import { JoyAppConfig } from "@symph/joy/src/next-server/server/joy-config/joy-app-config";

describe("joy dev ", () => {
  let app: JoyBoot;
  let port: number;
  beforeAll(async () => {
    // jest.resetModules()
    console.log(">>>>> start dev server");
    port = await findPort();
    const curPath = path.resolve(__dirname, "../");
    app = await launchApp(curPath, port);
    console.log(">>>>> server prepared", port);
  }, 9000000);

  afterAll(async () => {
    console.log(">>>>> server close");
    // @ts-ignore
    await app.closeSrv();
  });

  test("should start dev ", async () => {
    // const resp = await fetchViaHTTP(port, '/')
    // const http = await resp.text()
    // expect(resp.status).toBe(200)
    // expect(http).toContain('Welcome to Joy!')
    // console.log('>>>', port, http)
    const joyAppConfig = await app.get(JoyAppConfig);
    // const schema = await joyAppConfig!.getConfigSchema()
    await waitForMoment();
  }, 9000000);
});
