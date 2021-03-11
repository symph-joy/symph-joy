import * as path from "path";
import {
  fetchViaHTTP,
  findPort,
  launchApp,
  waitForMoment,
} from "../../../util/client-utils";
import { JoyBoot } from "../../../../src/joy-boot";

describe("hello joy dev", () => {
  let app: JoyBoot;
  let port: number;
  beforeAll(async () => {
    // jest.resetModules()
    port = await findPort();
    const curPath = path.resolve(__dirname, "../");
    app = await launchApp(curPath, port);
    console.log(">>>>> server prepared", port);
  }, 60000);

  afterAll(async () => {
    console.log(">>>>> server close");
    // @ts-ignore
    await app.closeSrv();
  });

  test("hello should start dev", async () => {
    await waitForMoment();
    // const resp = await fetchViaHTTP(port, '/')
    // const http = await resp.text()
    // expect(resp.status).toBe(200)
    // expect(http).toContain('Welcome to Joy!')
    // console.log('>>>', port, http)
  }, 1000000000);
});
