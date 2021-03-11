const notifier = require("node-notifier");
const relative = require("path").relative;

const babelClientOpts = {
  presets: [
    "@babel/preset-typescript",
    [
      "@babel/preset-env",
      {
        modules: "commonjs",
        targets: {
          esmodules: true,
        },
        loose: true,
        exclude: ["transform-typeof-symbol"],
      },
    ],
    "@babel/preset-react",
  ],
  plugins: [
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    [
      "@babel/plugin-transform-runtime",
      {
        corejs: 2,
        helpers: true,
        regenerator: false,
        useESModules: false,
      },
    ],
  ],
};

const babelServerOpts = {
  presets: [
    "@babel/preset-typescript",
    [
      "@babel/preset-env",
      {
        modules: "commonjs",
        targets: {
          node: "8.3",
        },
        loose: true,
        exclude: ["transform-typeof-symbol"],
      },
    ],
  ],
  plugins: [
    "babel-plugin-dynamic-import-node",
    ["@babel/plugin-proposal-class-properties", { loose: true }],
  ],
};

export async function compile(task) {
  await task.parallel([
    "bin",
    "server",
    "joybuild",
    "joybuildstatic",
    "pages",
    "components",
    "lib",
    "client",
  ]);
}

export async function bin(task, opts) {
  await task
    .source(opts.src || "bin/*")
    .babel(babelServerOpts, { stripExtension: true })
    .target("dist/bin", { mode: "0755" });
  notify("Compiled binaries");
}

export async function cli(task, opts) {
  await task
    .source(opts.src || "cli/**/*.+(js|ts|tsx)")
    .babel(babelServerOpts)
    .target("dist/cli");
  notify("Compiled cli files");
}

export async function lib(task, opts) {
  await task
    .source(opts.src || "lib/**/*.+(js|ts|tsx)")
    .babel(babelServerOpts)
    .target("dist/lib");
  notify("Compiled lib files");
}

export async function server(task, opts) {
  const babelOpts = {
    ...babelServerOpts,
    // the /server files may use React
    presets: [...babelServerOpts.presets, "@babel/preset-react"],
  };
  await task
    .source(opts.src || "server/**/*.+(js|ts|tsx)")
    .babel(babelOpts)
    .target("dist/server");
  notify("Compiled server files");
}

export async function joybuild(task, opts) {
  await task
    .source(opts.src || "build/**/*.+(js|ts|tsx)")
    .babel(babelServerOpts)
    .target("dist/build");
  notify("Compiled build files");
}

export async function client(task, opts) {
  await task
    .source(opts.src || "client/**/*.+(js|ts|tsx)")
    .babel(babelClientOpts)
    .target("dist/client");
  notify("Compiled client files");
}

// export is a reserved keyword for functions
export async function joybuildstatic(task, opts) {
  await task
    .source(opts.src || "export/**/*.+(js|ts|tsx)")
    .babel(babelServerOpts)
    .target("dist/export");
  notify("Compiled export files");
}

export async function pages(task, opts) {
  await task
    .source(opts.src || "pages/**/*.+(js|ts|tsx)")
    .babel(babelClientOpts)
    .target("dist/pages");
}

export async function components(task, opts) {
  await task
    .source(opts.src || "components/**/*.+(js|jsx|ts|tsx)")
    .babel(babelClientOpts)
    .target("dist/components");
}

export async function telemetry(task, opts) {
  await task
    .source(opts.src || "telemetry/**/*.+(js|ts|tsx)")
    .babel(babelServerOpts)
    .target("dist/telemetry");
  notify("Compiled telemetry files");
}

export async function build(task) {
  await task.serial(["compile"]);
}

export default async function (task) {
  await task.clear("dist");
  await task.start("build");
  await task.watch("bin/*", "bin");
  await task.watch("pages/**/*.+(js|ts|tsx)", "pages");
  await task.watch("components/**/*.+(js|ts|tsx)", "components");
  await task.watch("server/**/*.+(js|ts|tsx)", "server");
  await task.watch("build/**/*.+(js|ts|tsx)", "joybuild");
  await task.watch("export/**/*.+(js|ts|tsx)", "joybuildstatic");
  await task.watch("client/**/*.+(js|ts|tsx)", "client");
  await task.watch("lib/**/*.+(js|ts|tsx)", "lib");
  await task.watch("cli/**/*.+(js|ts|tsx)", "cli");
}

export async function joyserverlib(task, opts) {
  await task
    .source(opts.src || "joy-server/lib/**/*.+(js|ts|tsx)")
    .typescript({ module: "commonjs" })
    .target("dist/joy-server/lib");
  notify("Compiled lib files");
}

export async function joyserverserver(task, opts) {
  await task
    .source(opts.src || "joy-server/server/**/*.+(js|ts|tsx)")
    .typescript({ module: "commonjs" })
    .target("dist/joy-server/server");
  notify("Compiled server files");
}

export async function joyserverbuild(task) {
  await task.parallel(["joyserverserver", "joyserverlib"]);
}

export async function release(task) {
  await task.clear("dist").start("build");
}

// notification helper
function notify(msg) {
  return notifier.notify({
    title: "▲ Joy",
    message: msg,
    icon: false,
  });
}
