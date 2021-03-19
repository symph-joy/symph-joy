// import babelLoader from 'babel-loader'
import hash from "string-hash";
import { basename, join } from "path";
import * as Log from "../../output/log";

const babelLoader = require("babel-loader").default;

// increment 'm' to invalidate cache
// eslint-disable-next-line no-useless-concat
const cacheKey = "babel-cache-" + "m" + "-";
const nextBabelPreset = require("../../babel/preset");

const getModernOptions = (babelOptions: any = {}) => {
  const presetEnvOptions = Object.assign({}, babelOptions["preset-env"]);
  const transformRuntimeOptions = Object.assign(
    {},
    babelOptions["transform-runtime"],
    { regenerator: false }
  );

  presetEnvOptions.targets = {
    esmodules: true,
  };
  presetEnvOptions.exclude = [
    ...(presetEnvOptions.exclude || []),
    // Block accidental inclusions
    "transform-regenerator",
    "transform-async-to-generator",
  ];

  return {
    ...babelOptions,
    "preset-env": presetEnvOptions,
    "transform-runtime": transformRuntimeOptions,
  };
};

const nextBabelPresetModern = (presetOptions: any) => (context: any) =>
  nextBabelPreset(context, getModernOptions(presetOptions));

module.exports = babelLoader.custom((babel: any) => {
  const presetItem = babel.createConfigItem(nextBabelPreset, {
    type: "preset",
  });
  const applyCommonJs = babel.createConfigItem(
    require("../../babel/plugins/commonjs"),
    { type: "plugin" }
  );
  const commonJsItem = babel.createConfigItem(
    require("@babel/plugin-transform-modules-commonjs"),
    { type: "plugin" }
  );

  const configs = new Set();

  return {
    customOptions(opts: any) {
      const custom = {
        isServer: opts.isServer,
        isModern: opts.isModern,
        pagesDir: opts.pagesDir,
        hasModern: opts.hasModern,
        babelPresetPlugins: opts.babelPresetPlugins,
        development: opts.development,
        hasReactRefresh: opts.hasReactRefresh,
      };
      const filename = join(opts.cwd, "noop.js");
      const loader = Object.assign(
        opts.cache
          ? {
              cacheCompression: false,
              cacheDirectory: join(opts.distDir, "cache", "next-babel-loader"),
              cacheIdentifier:
                cacheKey +
                (opts.isServer ? "-server" : "") +
                (opts.isModern ? "-modern" : "") +
                (opts.hasModern ? "-has-modern" : "") +
                "-new-polyfills" +
                (opts.development ? "-development" : "-production") +
                (opts.hasReactRefresh ? "-react-refresh" : "") +
                JSON.stringify(
                  babel.loadPartialConfig({
                    filename,
                    cwd: opts.cwd,
                    sourceFileName: filename,
                  }).options
                ),
            }
          : {
              cacheDirectory: false,
            },
        opts
      );

      delete loader.isServer;
      delete loader.cache;
      delete loader.distDir;
      delete loader.isModern;
      delete loader.hasModern;
      delete loader.pagesDir;
      delete loader.babelPresetPlugins;
      delete loader.development;
      delete loader.hasReactRefresh;
      return { loader, custom };
    },
    config(
      cfg: any,
      {
        source,
        customOptions: {
          isServer,
          isModern,
          hasModern,
          pagesDir,
          babelPresetPlugins,
          development,
          hasReactRefresh,
        },
      }: any
    ) {
      // @ts-ignore
      const filename = this.resourcePath;
      const options = Object.assign({}, cfg.options);
      const isPageFile = filename.startsWith(pagesDir);

      if (cfg.hasFilesystemConfig()) {
        for (const file of [cfg.babelrc, cfg.config]) {
          // We only log for client compilation otherwise there will be double output
          if (file && !isServer && !configs.has(file)) {
            configs.add(file);
            Log.info(`Using external babel configuration from ${file}`);
          }
        }
      } else {
        // Add our default preset if the no "babelrc" found.
        options.presets = [...options.presets, presetItem];
      }

      options.caller.isServer = isServer;
      options.caller.isModern = isModern;
      options.caller.isDev = development;

      // @ts-ignore
      const emitWarning = this.emitWarning.bind(this);
      Object.defineProperty(options.caller, "onWarning", {
        enumerable: false,
        writable: false,
        value: options.caller.onWarning = function (reason: any) {
          if (!(reason instanceof Error)) {
            reason = new Error(reason);
          }
          emitWarning(reason);
        },
      });

      options.plugins = options.plugins || [];

      if (hasReactRefresh) {
        const reactRefreshPlugin = babel.createConfigItem(
          [require("react-refresh/babel"), { skipEnvCheck: true }],
          { type: "plugin" }
        );
        options.plugins.unshift(reactRefreshPlugin);
        if (!isServer) {
          const noAnonymousDefaultExportPlugin = babel.createConfigItem(
            [require("../../babel/plugins/no-anonymous-default-export"), {}],
            { type: "plugin" }
          );
          options.plugins.unshift(noAnonymousDefaultExportPlugin);
        }
      }

      if (!isServer && isPageFile) {
        const pageConfigPlugin = babel.createConfigItem(
          [require("../../babel/plugins/next-page-config")],
          { type: "plugin" }
        );
        options.plugins.push(pageConfigPlugin);

        const diallowExportAll = babel.createConfigItem(
          [
            require("../../babel/plugins/next-page-disallow-re-export-all-exports"),
          ],
          { type: "plugin" }
        );
        options.plugins.push(diallowExportAll);
      }

      if (isServer && source.indexOf("next/data") !== -1) {
        const nextDataPlugin = babel.createConfigItem(
          [
            require("../../babel/plugins/next-data"),
            { key: basename(filename) + "-" + hash(filename) },
          ],
          { type: "plugin" }
        );
        options.plugins.push(nextDataPlugin);
      }

      if (isModern) {
        const nextPreset = options.presets.find(
          (preset: any) => preset && preset.value === nextBabelPreset
        ) || { options: {} };

        const additionalPresets = options.presets.filter(
          (preset: any) => preset !== nextPreset
        );

        const presetItemModern = babel.createConfigItem(
          nextBabelPresetModern(nextPreset.options),
          {
            type: "preset",
          }
        );

        options.presets = [...additionalPresets, presetItemModern];
      }

      // If the file has `module.exports` we have to transpile commonjs because Babel adds `import` statements
      // That break webpack, since webpack doesn't support combining commonjs and esmodules
      if (!hasModern && source.indexOf("module.exports") !== -1) {
        options.plugins.push(applyCommonJs);
      }

      options.plugins.push([
        require.resolve("babel-plugin-transform-define"),
        {
          "process.env.NODE_ENV": development ? "development" : "production",
          "typeof window": isServer ? "undefined" : "object",
          "process.browser": isServer ? false : true,
        },
        "next-js-transform-define-instance",
      ]);

      if (isPageFile) {
        if (!isServer) {
          options.plugins.push([
            require.resolve("../../babel/plugins/next-ssg-transform"),
            {},
          ]);
        }
      }

      // As next-server/lib has stateful modules we have to transpile commonjs
      options.overrides = [
        ...(options.overrides || []),
        {
          // test: [
          //   /next[\\/]dist[\\/]next-server[\\/]lib/,
          //   /next[\\/]dist[\\/]client/,
          //   /next[\\/]dist[\\/]pages/,
          // ],
          test: [
            /joy[\\/]next-server[\\/]lib/,
            /joy[\\/]client/,
            /joy[\\/]pages/,
          ],
          plugins: [commonJsItem],
        },
      ];

      for (const plugin of babelPresetPlugins) {
        require(join(plugin.dir, "src", "babel-preset-build.js"))(
          options,
          plugin.config || {}
        );
      }

      return options;
    },
  };
});