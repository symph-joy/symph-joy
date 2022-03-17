import babelLoader from "babel-loader";
import hash from "string-hash";
import { basename, join } from "path";
import * as Log from "../../output/log";
import { joyBabelPreset } from "../../babel/preset";

// increment 'm' to invalidate cache
// eslint-disable-next-line no-useless-concat
const cacheKey = "babel-cache-" + "m" + "-";
// const joyBabelPreset = require('../../babel/preset')
// const joyBabelPreset = require('../../babel/preset')

const getModernOptions = (babelOptions = {}) => {
  const presetEnvOptions = Object.assign({}, babelOptions["preset-env"]);
  const transformRuntimeOptions = Object.assign({}, babelOptions["transform-runtime"], { regenerator: false });

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

const joyBabelPresetModern = (presetOptions) => (context) => joyBabelPreset(context, getModernOptions(presetOptions));

module.exports = babelLoader.custom((babel) => {
  const presetItem = babel.createConfigItem(joyBabelPreset, {
    type: "preset",
  });
  const applyCommonJs = babel.createConfigItem(require("../../babel/plugins/commonjs"), { type: "plugin" });
  const commonJsItem = babel.createConfigItem(require("@babel/plugin-transform-modules-commonjs"), { type: "plugin" });

  const configs = new Set();

  return {
    customOptions(opts) {
      const custom = {
        isServer: opts.isServer,
        isSrc: opts.isSrc,
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
              cacheDirectory: join(opts.distDir, "cache", "joy-babel-loader"),
              cacheIdentifier:
                cacheKey +
                (opts.isServer ? "-server" : "") +
                (opts.isSrc ? "-src" : "") +
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
      delete loader.isSrc;
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
    config(cfg, { source, customOptions: { isServer, isSrc, isModern, hasModern, pagesDir, babelPresetPlugins, development, hasReactRefresh } }) {
      const filename = this.resourcePath;
      const options = Object.assign({}, cfg.options);
      const isPageFile = filename.startsWith(pagesDir);
      const isCwdFile = filename.startsWith(options.cwd);

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

      options.caller.pagesDir = pagesDir;
      options.caller.isServer = isServer;
      options.caller.isSrc = isSrc;
      options.caller.isModern = isModern;
      options.caller.isDev = development;

      const emitWarning = this.emitWarning.bind(this);
      Object.defineProperty(options.caller, "onWarning", {
        enumerable: false,
        writable: false,
        value: (options.caller.onWarning = function (reason) {
          if (!(reason instanceof Error)) {
            reason = new Error(reason);
          }
          emitWarning(reason);
        }),
      });

      options.plugins = options.plugins || [];

      if (hasReactRefresh) {
        const reactRefreshPlugin = babel.createConfigItem([require("react-refresh/babel"), { skipEnvCheck: true }], { type: "plugin" });
        options.plugins.unshift(reactRefreshPlugin);
        if (!isServer && isCwdFile) {
          const noAnonymousDefaultExportPlugin = babel.createConfigItem(
            [require("../../babel/plugins/no-anonymous-default-export"), { dir: pagesDir }],
            { type: "plugin" }
          );
          options.plugins.unshift(noAnonymousDefaultExportPlugin);
        }
      }

      if (!isServer && isPageFile) {
        const pageConfigPlugin = babel.createConfigItem([require("../../babel/plugins/joy-page-config")], { type: "plugin" });
        options.plugins.push(pageConfigPlugin);

        const diallowExportAll = babel.createConfigItem([require("../../babel/plugins/joy-page-disallow-re-export-all-exports")], { type: "plugin" });
        options.plugins.push(diallowExportAll);
      }

      if (isServer && source.indexOf("joy/data") !== -1) {
        const joyDataPlugin = babel.createConfigItem([require("../../babel/plugins/joy-data"), { key: basename(filename) + "-" + hash(filename) }], {
          type: "plugin",
        });
        options.plugins.push(joyDataPlugin);
      }

      if (isModern) {
        const joyPreset = options.presets.find((preset) => preset && preset.value === joyBabelPreset) || { options: {} };

        const additionalPresets = options.presets.filter((preset) => preset !== joyPreset);

        const presetItemModern = babel.createConfigItem(joyBabelPresetModern(joyPreset.options), {
          type: "preset",
        });

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
        "joy-js-transform-define-instance",
      ]);

      if (isPageFile) {
        if (!isServer) {
          options.plugins.push([require.resolve("../../babel/plugins/joy-ssg-transform"), {}]);
        }
      }

      // As joy-server/lib has stateful modules we have to transpile commonjs
      // options.overrides = [
      //   ...(options.overrides || []),
      //   {
      //     // test: [
      //     //   /next[\\/]dist[\\/]joy-server[\\/]lib/,
      //     //   /next[\\/]dist[\\/]client/,
      //     //   /next[\\/]dist[\\/]pages/,
      //     // ],
      //     test: [
      //       /joy[\\/]joy-server[\\/]lib/,
      //       /joy[\\/]client/,
      //       /joy[\\/]aapages/,
      //     ],
      //     plugins: [commonJsItem],
      //   },
      // ]

      for (const plugin of babelPresetPlugins) {
        require(join(plugin.dir, "src", "babel-preset-build.js"))(options, plugin.config || {});
      }

      return options;
    },
  };
});
