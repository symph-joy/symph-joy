import { ParsedUrlQuery, stringify, ParsedUrlQueryInput } from "querystring";
import { IncomingMessage, ServerResponse } from "http";
// import {JoyBoot} from "../../src/joy";
// import {NextServer} from "../../src/next-server/server/next-server";
// import {PresetJoyCore} from "../../src/preset-joy-core";
import { JoyBoot } from "@symph/joy/src/joy-boot";
import { NextServer } from "@symph/joy/src/next-server/server/next-server";
import { PresetJoyCore } from "@symph/joy/src/preset-joy-core";

export async function renderViaAPI(
  app: NextServer,
  pathname: string,
  query?: ParsedUrlQuery
): Promise<string | null> {
  const url = `${pathname}${query ? `?${stringify(query)}` : ""}`;
  return app.renderToHTML(
    { url } as IncomingMessage,
    {} as ServerResponse,
    pathname,
    query
  );
}

export async function renderViaHTTP(
  appPort: number,
  pathname: string,
  query?: ParsedUrlQueryInput
): Promise<string> {
  return fetchViaHTTP(appPort, pathname, query).then((res) => res.text());
}

export async function fetchViaHTTP(
  appPort: number,
  pathname: string,
  query?: ParsedUrlQueryInput,
  opts?: RequestInit
): Promise<Response> {
  const url = `http://localhost:${appPort}${pathname}${
    query ? `?${stringify(query)}` : ""
  }`;
  return fetch(url, opts);
}

export function findPort(): number {
  // return getPort()
  return 4000;
}

export async function waitForMoment(millisecond = 100000000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
}

export async function runNextCommandDev(argv: any): Promise<JoyBoot> {
  // todo 在jest启动的时候，设置通用的环境变量
  // const env = {
  //   ...process.env,
  //   __NEXT_TEST_MODE: 'true',
  //   ...opts.env,
  // }
  // process.env = env
  let app;
  try {
    app = new JoyBoot(PresetJoyCore);
    await app.init();
    await app.runCommand({ name: "dev", args: argv });
  } catch (e) {
    // 因为jest (v26.4.2) 的问题，
    console.error(e);
  }
  return app as JoyBoot;
}

// Launch the app in dev mode.
export async function launchApp(dir: any, port: any) {
  return await runNextCommandDev({ _: [dir], hostname: "localhost", port });
}
