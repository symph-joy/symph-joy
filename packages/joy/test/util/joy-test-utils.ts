import { ParsedUrlQuery, ParsedUrlQueryInput, stringify } from "querystring";
import { IncomingMessage, ServerResponse } from "http";
import { JoyBoot, JoyReactServer, JoyBootConfiguration } from "@symph/joy";
import path from "path";
import spawn from "cross-spawn";
import child_process from "child_process";
import treeKill from "tree-kill";
import { OptionsOfTextResponseBody } from "got/dist/source/types";
import got from "got";

export async function renderViaAPI(app: JoyReactServer, pathname: string, query?: ParsedUrlQuery): Promise<string | null> {
  const url = `${pathname}${query ? `?${stringify(query)}` : ""}`;
  return app.renderToHTML({ url } as IncomingMessage, {} as ServerResponse, pathname, query);
}

export async function renderViaHTTP(appPort: number, pathname: string, query?: ParsedUrlQueryInput): Promise<string> {
  return fetchViaHTTP(appPort, pathname, query).then((res) => res.text());
}

export async function fetchViaHTTP(appPort: number, pathname: string, query?: ParsedUrlQueryInput, opts?: RequestInit): Promise<Response> {
  const url = `http://localhost:${appPort}${pathname}${query ? `?${stringify(query)}` : ""}`;
  return fetch(url, opts);
}

export async function findPort(): Promise<number> {
  // return getPort();
  return 4000;
}

export async function waitForMoment(millisecond = 100000000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
}

/**
 * 轮询的方式获取接口数据，直到获取到匹配的内容，或者超时。
 * @param url
 * @param options
 * @param waitingReg
 * @param timeout
 */
export async function pollGetText(url: string, options: OptionsOfTextResponseBody | undefined, waitingReg: RegExp, timeout = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const pollFn = async () => {
      try {
        const res = await got.get(
          url,
          Object.assign(
            {
              throwHttpErrors: false,
              responseType: "text",
            },
            options
          )
        );
        const respText = res.body.trim();
        if (waitingReg.test(respText)) {
          pollTimer = undefined;
          if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = undefined;
          }
          return resolve(respText);
        }
      } catch (e) {
        //do nothing, should continual waiting
      }
      pollTimer = setTimeout(pollFn, 1000);
    };

    let pollTimer: NodeJS.Timeout | undefined = setTimeout(pollFn, 500);

    let timeoutTimer: NodeJS.Timeout | undefined = setTimeout(() => {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = undefined;
      }
      reject(new Error(`pollGet url:${url} timeout:${timeout}`));
    }, timeout);
  });
}

export interface RunOptions {
  onStdout?: (message: string) => any;
  onStderr?: (message: string) => any;
  stdout?: boolean;
  stderr?: boolean;
  env?: Record<string, any>;
  cwd?: string;
  spawnOptions?: any;
  instance?: (proc: child_process.ChildProcess) => void;
  ignoreFail?: boolean;
}

export function runJoyCommand(argv: string[], opts: RunOptions = { stdout: true, stderr: true }) {
  const nextDir = path.dirname(require.resolve("@symph/joy/package"));
  const nextBin = path.join(nextDir, "bin/joy");
  const cwd = opts.cwd || nextDir;
  // Let Next.js decide the environment
  const env = {
    ...process.env,
    ...opts.env,
    NODE_ENV: "",
    __NEXT_TEST_MODE: "true",
  };

  return new Promise<{ code: number; stdout?: string; stderr?: string }>((resolve, reject) => {
    console.log(`Running command "joy ${argv.join(" ")}"`);
    const instance = spawn("node", [nextBin, ...argv, "--no-deprecation"], {
      ...opts.spawnOptions,
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (typeof opts.instance === "function") {
      opts.instance(instance);
    }

    let stderrOutput = "";
    // if (opts.stderr) {
    //   instance.stderr!.on('data', function (chunk) {
    //     stderrOutput += chunk
    //   })
    // }
    instance.stderr!.on("data", function (chunk) {
      const message = chunk.toString();
      if (typeof opts.onStderr === "function") {
        opts.onStderr(message);
      }

      if (opts.stderr) {
        process.stderr.write(message);
      } else {
        stderrOutput += chunk;
      }
    });

    let stdoutOutput = "";
    instance.stdout!.on("data", function (chunk) {
      const message: string = chunk.toString();
      if (typeof opts.onStdout === "function") {
        opts.onStdout(message);
      }

      if (opts.stdout) {
        process.stdout.write(message);
      } else {
        stdoutOutput += chunk;
      }
    });

    // if (opts.stdout) {
    //   instance.stdout!.on('data', function (chunk) {
    //     stdoutOutput += chunk
    //   })
    // }

    instance.on("close", (code) => {
      if (code === null) {
        code = 1;
      }

      if (!opts.stderr && !opts.stdout && !opts.ignoreFail && code !== 0) {
        return reject(new Error(`command failed with code ${code}`));
      }

      resolve({
        code,
        stdout: stdoutOutput,
        stderr: stderrOutput,
      });
    });

    instance.on("error", (err: any) => {
      err.stdout = stdoutOutput;
      err.stderr = stderrOutput;
      reject(err);
    });
  });
}

export function runJoyServer(dev: boolean, argv: any[], opts: RunOptions = {}) {
  const nextDir = path.dirname(require.resolve("@symph/joy/package"));
  const cwd = opts.cwd || nextDir;
  const env = {
    ...process.env,
    NODE_ENV: "test" as const,
    __NEXT_TEST_MODE: "true",
    ...opts.env,
  };

  return new Promise<child_process.ChildProcess>((resolve, reject) => {
    const instance = spawn("node", ["--no-deprecation", "bin/joy", dev ? "dev" : "start", ...argv], { ...opts.spawnOptions, cwd, env });
    let didResolve = false;

    function handleStdout(data: any) {
      const message: string = data.toString();
      const bootupMarkers = {
        dev: /started server on/i,
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
    treeKill(instance.pid as number, (err) => {
      if (err) {
        if (
          process.platform === "win32" &&
          typeof err.message === "string" &&
          (err.message.includes(`no running instance of the task`) || err.message.includes(`not found`))
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

export async function startJoyServer(dev: boolean, args: any): Promise<JoyBoot> {
  // todo 在jest启动的时候，设置通用的环境变量
  // const env = {
  //   ...process.env,
  //   __NEXT_TEST_MODE: 'true',
  //   ...opts.env,
  // }
  // process.env = env
  let joyBoot: JoyBoot;
  try {
    joyBoot = new JoyBoot();
    await joyBoot.runCommand(dev ? "dev" : "start", args);
  } catch (e) {
    // 因为jest (v26.4.2) 的问题，这里泡出异常，不能打印日志详细内容，所以这里手动打印一次。
    console.error(e);
    throw e;
  }
  return joyBoot;
}

// Launch the app in dev mode.
export async function joyDev(dir: any, port: any, options?: RunOptions): Promise<child_process.ChildProcess> {
  // return await runNextCommandDev({_: [dir], hostname: "localhost", port}) as any;
  return runJoyServer(true, [dir, "--host=localhost", `--port=${port}`], options);
}

export function joyStart(dir: string, port: number, opts?: RunOptions) {
  return runJoyServer(false, [dir, "-p", port], opts);
}

export function joyBuild(dir: string, args: any[] = [], opts?: RunOptions) {
  return runJoyCommand(["build", dir, ...args], opts);
}

export function joyExport(dir: string, outdir: string, opts?: RunOptions) {
  return runJoyCommand(["export", dir, "--outdir", outdir], opts);
}

export function joyExportDefault(dir: string, opts?: RunOptions) {
  return runJoyCommand(["export", dir], opts);
}
