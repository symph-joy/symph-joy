import { ServerFactory } from "@symph/server";
import { PipeConfig } from "../src/pipe/pipe-config";
import { INestApplication } from "@symph/server";
import { findPort, getUrl } from "../../../utils/joy-test-utils";
import got from "got";

describe("Hello world", () => {
  let server: any;
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    app = await ServerFactory.create({ PipeConfig });
    port = await findPort();
    await app.listen(port);
    server = app.getHttpServer();
  });

  test(`should return been transformed value by route params pipe`, async () => {
    const url = getUrl(port, "/pipe/1");
    const response = (await got.get(url, {
      throwHttpErrors: false,
      responseType: "json",
    })) as any;
    expect(response.body.id).toBe("1");
  });

  afterAll(async () => {
    await app.close();
  });
});
