import {
  INestApplication,
  ServerFactory,
  ServeStaticConfig,
} from "@symph/server";
import { findPort, getUrl } from "../../../utils/joy-test-utils";
import got from "got";
import { Configuration } from "@symph/core";
import path from "path";

@Configuration({ imports: { ServeStaticConfig } })
class AppConfig {}

describe("serve static", () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    app = await ServerFactory.create(AppConfig, {
      static: [
        {
          rootPath: path.join(__dirname, "../static"),
          serveRoot: "/static",
        },
      ],
    });
    port = await findPort();
    await app.listen(port);
  });

  test(`start serve static service by config`, async () => {
    const url = getUrl(port, "/static/hello.txt");
    const response = await got.get<string>(url, { throwHttpErrors: false });
    expect(response.body.trim()).toBe("Hello world!");
  }, 9999999);

  // test(`register serve static.`, async () => {
  //   const serveStaticService = await app.get(ServeStaticService)
  //   serveStaticService.register([{
  //     rootPath: path.join(__dirname, '../static'),
  //     serveRoot: '/dynamic-static',
  //     serveStaticOptions: {
  //       decorateReply: false
  //     }
  //   }])
  //   const url = getUrl(port, "/dynamic-static/hello.txt");
  //   const response = await got.get<string>(url, {throwHttpErrors: false});
  //   expect(response.body.trim()).toBe("Hello world!");
  // }, 9999999);

  afterAll(async () => {
    await app.close();
  });
});
