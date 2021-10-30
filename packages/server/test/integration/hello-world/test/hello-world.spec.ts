import { INestApplication, ServerFactory } from "@symph/server";
import { HelloConfig } from "../src/hello-config";
import { findPort, getUrl } from "../../../utils/joy-test-utils";
import got from "got";

describe("Hello world", () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    app = await ServerFactory.create({ HelloConfig });
    port = await findPort();
    try {
      await app.listen(port);
    } catch (e) {
      console.log(e);
    }
  }, 999999);

  test(`should response message`, async () => {
    const url = getUrl(port, "/hello/hi");
    const response = await got.get(url, { throwHttpErrors: false });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("Hello world!");
  }, 999999);

  test(`route return(Promise/async handler), should response message`, async () => {
    const url = getUrl(port, "/hello/async");
    const response = await got.get(url, { throwHttpErrors: false });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("Hello world!");
  });

  test(`route return(Observable stream), should response message`, async () => {
    const url = getUrl(port, "/hello/stream");
    const response = await got.get(url, { throwHttpErrors: false });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("Hello world!");
  });

  afterAll(async () => {
    await app.close();
  });
});
