import http from "http";
import joy from "../joy";

export default async function start(
  serverOptions: any,
  port?: number,
  hostname?: string
) {
  const app = joy({
    ...serverOptions,
    customServer: false,
  });
  const srv = http.createServer(app.getRequestHandler());
  await new Promise<void>((resolve, reject) => {
    // This code catches EADDRINUSE error if the port is already in use
    srv.on("error", reject);
    srv.on("listening", () => resolve());
    srv.listen(port, hostname);
  });
  // todo 重新设计，当应用关闭时，也要关闭http模块，否则jest测试item无法结束。
  // @ts-ignore
  app.closeSrv = async () => {
    await app.close();
    return new Promise<void>((resolve, reject) => {
      srv.close((err) => {
        err ? reject(err) : resolve();
      });
    });
  };
  // It's up to caller to run `app.prepare()`, so it can notify that the server
  // is listening before starting any intensive operations.
  return app;
}
