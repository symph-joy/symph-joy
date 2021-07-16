import { ServerFactory } from "@symph/server";
import { PipeConfig } from "../src/pipe/pipe-config";
import { INestApplication } from "@symph/server";
import { findPort, getUrl, waitForMoment } from "../../../utils/joy-test-utils";
import got from "got";
import path from "path";

describe("static", () => {
  let server: any;
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    app = await ServerFactory.create({});

    try {
      const root = path.resolve(__filename, "../../src/static");
      await app.getHttpAdapter().useStaticAssets?.({ root, prefix: "/static" });
    } catch (e) {
      console.log(e);
    }
    port = await findPort();
    await app.listen(port);
    server = app.getHttpServer();
  });

  test(`should return the static file`, async () => {
    const url = getUrl(port, "/static/hello.txt");
    const response = await got.get<string>(url, { throwHttpErrors: false });
    expect(response.body.trim()).toBe("Hello world!");
  });

  afterAll(async () => {
    await app.close();
  });
});
