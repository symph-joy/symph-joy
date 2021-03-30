import { ParsedUrlQuery, stringify, ParsedUrlQueryInput } from "querystring";
import { IncomingMessage, ServerResponse } from "http";
// import {JoyBoot} from "../../src/joy";
// import {NextServer} from "../../src/next-server/server/next-server";
// import {PresetJoyCore} from "../../src/preset-joy-core";
import { JoyBoot, PresetJoyCore, NextServer } from "@symph/joy";
import path from "path";
import spawn from "cross-spawn";
import child_process from "child_process";
import treeKill from "tree-kill";
import getPort from "get-port";

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

export async function findPort(): Promise<number> {
  return getPort();
  // return 4000;
}

export async function waitForMoment(millisecond = 100000000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
}

interface RunOptions {
  onStdout?: (message: string) => any;
  onStderr?: (message: string) => any;
  stdout?: boolean;
  stderr?: boolean;
  env?: Record<string, any>;
}

export function runNextServerProc(
  dev: boolean,
  argv: string[],
  opts: RunOptions = {}
) {
  const cwd = path.dirname(require.resolve("@symph/joy/package"));
  const env = {
    ...process.env,
    NODE_ENV: "test" as const,
    __NEXT_TEST_MODE: "true",
    ...opts.env,
  };

  return new Promise<child_process.ChildProcess>((resolve, reject) => {
    const instance = spawn(
      "node",
      ["--no-deprecation", "bin/joy", dev ? "dev" : "start", ...argv],
      { cwd, env }
    );
    let didResolve = false;

    function handleStdout(data: any) {
      const message: string = data.toString();
      const bootupMarkers = {
        dev: /compiled successfully/i,
        start: /started server/i,
      };
      if (bootupMarkers[dev ? "dev" : "start"].test(message)) {
        if (!didResolve) {
          didResolve = true;
          resolve(instance);
        }
      }

      if (typeof opts.onStdout === "function") {
        opts.onStdout(message);
      }

      if (opts.stdout !== false) {
        process.stdout.write(message);
      }
    }

    function handleStderr(data: any) {
      const message = data.toString();
      if (typeof opts.onStderr === "function") {
        opts.onStderr(message);
      }

      if (opts.stderr !== false) {
        process.stderr.write(message);
      }
    }

    instance.stdout!.on("data", handleStdout);
    instance.stderr!.on("data", handleStderr);

    instance.on("close", () => {
      instance.stdout!.removeListener("data", handleStdout);
      instance.stderr!.removeListener("data", handleStderr);
      if (!didResolve) {
        didResolve = true;
        if (instance.exitCode !== 0) {
          reject(new Error(`Exist code: ${instance.exitCode}`));
        } else {
          resolve(instance);
        }
      }
    });

    instance.on("error", (err) => {
      reject(err);
    });
  });
}

// Kill a launched app
export async function killApp(instance: child_process.ChildProcess) {
  await new Promise<void>((resolve, reject) => {
    treeKill(instance.pid, (err) => {
      if (err) {
        if (
          process.platform === "win32" &&
          typeof err.message === "string" &&
          (err.message.includes(`no running instance of the task`) ||
            err.message.includes(`not found`))
        ) {
          // Windows throws an error if the process is already dead
          //
          // Command failed: taskkill /pid 6924 /T /F
          // ERROR: The process with PID 6924 (child process of PID 6736) could not be terminated.
          // Reason: There is no running instance of the task.
          return resolve();
        }
        return reject(err);
      }
      resolve();
    });
  });
}

export async function runNextServer(dev: boolean, args: any): Promise<JoyBoot> {
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
    await app.runCommand(dev ? "dev" : "start", args);
  } catch (e) {
    // 因为jest (v26.4.2) 的问题，
    console.error(e);
  }
  return app as JoyBoot;
}

// Launch the app in dev mode.
export async function launchApp(
  dir: any,
  port: any
): Promise<child_process.ChildProcess> {
  // return await runNextCommandDev({_: [dir], hostname: "localhost", port}) as any;
  return runNextServerProc(true, [dir, "--host=localhost", `--port=${port}`]);
}
