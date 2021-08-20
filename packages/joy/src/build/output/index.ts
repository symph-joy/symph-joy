import chalk from "chalk";
import stripAnsi from "strip-ansi";
import textTable from "text-table";
import createStore from "unistore";
import formatWebpackMessages from "../../client/dev/error-overlay/format-webpack-messages";
import { OutputState, store as consoleStore } from "./store";

export function startedDevelopmentServer(appUrl: string) {
  consoleStore.setState({ appUrl });
}

let previousSrc: import("webpack").Compiler | null = null;
let previousClient: import("webpack").Compiler | null = null;
let previousServer: import("webpack").Compiler | null = null;
let previousApi: import("webpack").Compiler | null = null;

type CompilerDiagnosticsWithFile = {
  errors: { file: string | undefined; message: string }[] | null;
  warnings: { file: string | undefined; message: string }[] | null;
};

type CompilerDiagnostics = {
  errors: string[] | null;
  warnings: string[] | null;
};

type WebpackStatus = { loading: true } | ({ loading: false } & CompilerDiagnostics);

type AmpStatus = {
  message: string;
  line: number;
  col: number;
  specUrl: string | null;
  code: string;
};

export type AmpPageStatus = {
  [page: string]: { errors: AmpStatus[]; warnings: AmpStatus[] };
};

type BuildStatusStore = {
  client: WebpackStatus;
  server: WebpackStatus;
  amp: AmpPageStatus;
  api: WebpackStatus;
  src: WebpackStatus;
};

enum WebpackStatusPhase {
  COMPILING = 1,
  COMPILED_WITH_ERRORS = 2,
  COMPILED_WITH_WARNINGS = 4,
  COMPILED = 5,
}

function getWebpackStatusPhase(status: WebpackStatus): WebpackStatusPhase {
  if (status.loading) {
    return WebpackStatusPhase.COMPILING;
  }

  if (status.errors) {
    return WebpackStatusPhase.COMPILED_WITH_ERRORS;
  }
  if (status.warnings) {
    return WebpackStatusPhase.COMPILED_WITH_WARNINGS;
  }
  return WebpackStatusPhase.COMPILED;
}

export function formatAmpMessages(amp: AmpPageStatus) {
  let output = chalk.bold("Amp Validation") + "\n\n";
  const messages: string[][] = [];

  const chalkError = chalk.red("error");
  function ampError(page: string, error: AmpStatus) {
    messages.push([page, chalkError, error.message, error.specUrl || ""]);
  }

  const chalkWarn = chalk.yellow("warn");
  function ampWarn(page: string, warn: AmpStatus) {
    messages.push([page, chalkWarn, warn.message, warn.specUrl || ""]);
  }

  for (const page in amp) {
    let { errors, warnings } = amp[page];

    const devOnlyFilter = (err: AmpStatus) => err.code !== "DEV_MODE_ONLY";
    errors = errors.filter(devOnlyFilter);
    warnings = warnings.filter(devOnlyFilter);
    if (!(errors.length || warnings.length)) {
      // Skip page with no non-dev warnings
      continue;
    }

    if (errors.length) {
      ampError(page, errors[0]);
      for (let index = 1; index < errors.length; ++index) {
        ampError("", errors[index]);
      }
    }
    if (warnings.length) {
      ampWarn(errors.length ? "" : page, warnings[0]);
      for (let index = 1; index < warnings.length; ++index) {
        ampWarn("", warnings[index]);
      }
    }
    messages.push(["", "", "", ""]);
  }

  if (!messages.length) {
    return "";
  }

  output += textTable(messages, {
    align: ["l", "l", "l", "l"],
    stringLength(str: string) {
      return stripAnsi(str).length;
    },
  });

  return output;
}

const buildStore = createStore<BuildStatusStore>();

buildStore.subscribe((state: any) => {
  const { amp, client, server, api, src } = state;

  const [{ status }] = [
    { status: client, phase: getWebpackStatusPhase(client) },
    { status: server, phase: getWebpackStatusPhase(server) },
    { status: api, phase: getWebpackStatusPhase(api) },
    { status: src, phase: getWebpackStatusPhase(src) },
  ].sort((a, b) => a.phase.valueOf() - b.phase.valueOf());

  const loading = status.loading;

  const { bootstrap: bootstrapping, appUrl } = consoleStore.getState();
  if (bootstrapping && loading) {
    return;
  }

  const partialState: Partial<OutputState> = {
    bootstrap: false,
    appUrl: appUrl,
  };

  if (loading) {
    consoleStore.setState({ ...partialState, loading: true } as OutputState, true);
  } else {
    let { errors, warnings } = status;

    // if (errors == null) {
    //   if (Object.keys(amp).length > 0) {
    //     warnings = (warnings || []).concat(formatAmpMessages(amp) || []);
    //     if (!warnings.length) warnings = null;
    //   }
    // }

    consoleStore.setState(
      {
        ...partialState,
        loading: false,
        typeChecking: false,
        errors,
        warnings,
      } as OutputState,
      true
    );
  }
});

export function ampValidation(page: string, errors: AmpStatus[], warnings: AmpStatus[]) {
  const { amp } = buildStore.getState();
  if (!(errors.length || warnings.length)) {
    buildStore.setState({
      amp: Object.keys(amp)
        .filter((k) => k !== page)
        .sort()
        // eslint-disable-next-line no-sequences
        .reduce((a, c) => ((a[c] = amp[c]), a), {} as AmpPageStatus),
    });
    return;
  }

  const newAmp: AmpPageStatus = { ...amp, [page]: { errors, warnings } };
  buildStore.setState({
    amp: Object.keys(newAmp)
      .sort()
      // eslint-disable-next-line no-sequences
      .reduce((a, c) => ((a[c] = newAmp[c]), a), {} as AmpPageStatus),
  });
}

export function watchCompilers(client: import("webpack").Compiler, server: import("webpack").Compiler, api: import("webpack").Compiler, src: import("webpack").Compiler) {
  if (previousClient === client && previousServer === server && previousApi === api) {
    return;
  }

  buildStore.setState({
    client: { loading: true },
    server: { loading: true },
    api: { loading: true },
    src: { loading: true },
  });

  function tapCompiler(key: string, compiler: any, onEvent: (status: WebpackStatus) => void) {
    compiler.hooks.invalid.tap(`JoyJsInvalid-${key}`, () => {
      onEvent({ loading: true });
    });

    compiler.hooks.done.tap(`JoyJsDone-${key}`, (stats: import("webpack").Stats) => {
      // buildStore.setState({ amp: {} });

      const { errors, warnings } = formatWebpackMessages(stats.toJson({ all: false, warnings: true, errors: true }));

      const hasErrors = !!errors?.length;
      const hasWarnings = !!warnings?.length;

      onEvent({
        loading: false,
        errors: hasErrors ? errors : null,
        warnings: hasWarnings ? warnings : null,
      });
    });
  }

  tapCompiler("client", client, (status) => buildStore.setState({ client: status }));
  tapCompiler("server", server, (status) => buildStore.setState({ server: status }));
  tapCompiler("api", api, (status) => buildStore.setState({ api: status }));
  tapCompiler("src", api, (status) => buildStore.setState({ src: status }));

  previousClient = client;
  previousServer = server;
  previousApi = api;
  previousSrc = src;
}
