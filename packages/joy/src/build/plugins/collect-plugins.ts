import findUp from "find-up";
import { promises } from "fs";
import path from "path";
import resolve from "resolve/index.js";
import { execOnce } from "../../joy-server/lib/utils";

export type PluginMetaData = {
  requiredEnv: string[];
  middleware: string[];
  pluginName: string;
  directory: string;
  pkgName: string;
  version: string;
  config?: { [name: string]: any };
};

// currently supported middleware
export const VALID_MIDDLEWARE = [
  "document-head-tags-server",
  "on-init-client",
  "on-init-server",
  "on-error-server",
  "on-error-client",
  "on-error-client",
  "on-error-server",
  "babel-preset-build",
];

type ENV_OPTIONS = { [name: string]: string };

const exitWithError = (error: string) => {
  console.error(error);
  process.exit(1);
};

async function collectPluginMeta(
  env: ENV_OPTIONS,
  pluginPackagePath: string
): Promise<PluginMetaData> {
  const pkgDir = path.dirname(pluginPackagePath);
  const pluginPackageJson = require(pluginPackagePath);
  const pluginMetaData: {
    name: string;
    "required-env": string[];
  } = pluginPackageJson.joyjs;

  if (!pluginMetaData) {
    exitWithError('Joy.js plugins need to have a "joyjs" key in package.json');
  }

  if (!pluginMetaData.name) {
    exitWithError(
      'Joy.js plugins need to have a "joyjs.name" key in package.json'
    );
  }

  // TODO: add err.sh explaining requirements
  let middleware: string[] = [];
  try {
    middleware = (
      await promises.readdir(path.join(pkgDir, "src"), { withFileTypes: true })
    )
      .filter((dirent) => dirent.isFile())
      .map((file) => file.name);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(err);
    }
    exitWithError(
      `Failed to read src/ directory for Joy.js plugin: ${pluginMetaData.name}`
    );
  }

  // remove the extension from the middleware
  middleware = middleware.map((item) => {
    const parts = item.split(".");
    parts.pop();
    return parts.join(".");
  });

  const invalidMiddleware: string[] = [];

  for (const item of middleware) {
    if (!VALID_MIDDLEWARE.includes(item)) {
      invalidMiddleware.push(item);
    }
  }

  if (invalidMiddleware.length > 0) {
    console.error(
      `Joy.js Plugin: ${
        pluginMetaData.name
      } listed invalid middleware ${invalidMiddleware.join(", ")}`
    );
  }

  // TODO: investigate requiring plugins' env be prefixed
  // somehow to prevent collision
  if (!Array.isArray(pluginMetaData["required-env"])) {
    exitWithError(
      'Joy.js plugins need to have a "joyjs.required-env" key in package.json'
    );
  }

  const missingEnvFields: string[] = [];

  for (const field of pluginMetaData["required-env"]) {
    if (typeof env[field] === "undefined") {
      missingEnvFields.push(field);
    }
  }

  if (missingEnvFields.length > 0) {
    exitWithError(
      `Joy.js Plugin: ${
        pluginMetaData.name
      } required env ${missingEnvFields.join(
        ", "
      )} but was missing in your \`joy.config.js\``
    );
  }

  return {
    middleware,
    directory: pkgDir.replace(/\\/g, "/"),
    requiredEnv: pluginMetaData["required-env"],
    version: pluginPackageJson.version,
    pluginName: pluginMetaData.name,
    pkgName: pluginPackageJson.name,
  };
}

// clean package name so it can be used as variable
export const getPluginId = (pkg: string): string => {
  pkg = pkg.replace(/\W/g, "");

  if (pkg.match(/^[0-9]/)) {
    pkg = `_${pkg}`;
  }
  return pkg;
};

type PluginConfig =
  | string
  | {
      name: string;
      config: { [name: string]: any };
    };

async function _collectPlugins(
  dir: string,
  env: ENV_OPTIONS,
  pluginsConfig: PluginConfig[] | undefined
): Promise<PluginMetaData[]> {
  let joyPluginNames: string[] = [];
  const skippedPluginNames: string[] = [];
  const hasPluginConfig = Array.isArray(pluginsConfig);

  const joyPluginConfigNames = hasPluginConfig
    ? pluginsConfig!.map((config) =>
        typeof config === "string" ? config : config.name
      )
    : null;

  const rootPackageJsonPath = await findUp("package.json", { cwd: dir });
  if (!rootPackageJsonPath && !joyPluginConfigNames) {
    console.log("Failed to load plugins, no package.json");
    return [];
  }

  if (rootPackageJsonPath) {
    const rootPackageJson = require(rootPackageJsonPath);
    let dependencies: string[] = [];
    if (rootPackageJson.dependencies) {
      dependencies = dependencies.concat(
        Object.keys(rootPackageJson.dependencies)
      );
    }

    if (rootPackageJson.devDependencies) {
      dependencies = dependencies.concat(
        Object.keys(rootPackageJson.devDependencies)
      );
    }

    // find packages with the naming convention
    // @scope/joy-plugin-[name]
    // @symph/joy-plugin-[name]
    // joy-plugin-[name]
    const filteredDeps = dependencies.filter((name) => {
      return name.match(/(^@symph\|joy-plugin-)/);
    });

    if (joyPluginConfigNames) {
      for (const dep of filteredDeps) {
        if (!joyPluginConfigNames.includes(dep)) {
          skippedPluginNames.push(dep);
        }
      }
      joyPluginNames = joyPluginConfigNames;
    } else {
      joyPluginNames = filteredDeps;
    }
  }

  const joyPluginMetaData = await Promise.all(
    joyPluginNames.map((name) =>
      collectPluginMeta(
        env,
        resolve.sync(path.join(name, "package.json"), {
          basedir: dir,
          preserveSymlinks: true,
        })
      )
    )
  );

  for (const plugin of joyPluginMetaData) {
    // Add plugin config from `joy.config.js`
    if (hasPluginConfig) {
      const curPlugin = pluginsConfig!.find(
        (config) =>
          config && typeof config === "object" && config.name === plugin.pkgName
      );
      if (curPlugin && typeof curPlugin === "object") {
        plugin.config = curPlugin.config;
      }
    }
    console.log(
      `Loaded plugin: ${plugin.pkgName}${
        plugin.version ? `@${plugin.version}` : ""
      }`
    );
  }

  if (skippedPluginNames.length) {
    console.log(
      `Plugins config used skipped loading: ${skippedPluginNames.join(", ")}`
    );
  }
  console.log();

  return joyPluginMetaData;
}

// only execute it once between server/client configs
// since the plugins need to match
export const collectPlugins = execOnce(_collectPlugins);
