import {
  INestApplication,
  ServerApplication,
  ServerFactory,
  ServeStaticConfig,
  ServeStaticService,
} from "@symph/server";
import { findPort, getUrl, waitForMoment } from "../../../utils/joy-test-utils";
import got from "got";
import { Configuration } from "@symph/core";
import path from "path";
import http from "http";
import { HelloController } from "../src/hello.controller";
import { HelloConfig } from "../src/hello-config";

// @Configuration({imports: {ServeStaticConfig}})
// class AppConfig {
//
// }

describe("custom-http-server", () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    app = await ServerFactory.create(HelloConfig, {});
    port = await findPort();
    await app.listen(port);
  });

  test(`custom a http server.`, async () => {
    const routing = ((app as ServerApplication).httpAdapter as any).instance
      .routing;
    const server = http.createServer((req, res) => {
      routing(req, res);
    });
    port = await findPort();
    server.listen(port);
    const url = getUrl(port, "/hello/hi");
    const response = await got.get<string>(url, { throwHttpErrors: false });
    expect(response.body.trim()).toBe("Hello world!");
    server.close();
  }, 9999999);

  afterAll(async () => {
    await app.close();
  });
});
