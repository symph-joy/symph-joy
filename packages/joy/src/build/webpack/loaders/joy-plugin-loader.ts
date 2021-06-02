// import { loader } from 'webpack'
import { parse } from "querystring";
import { PluginMetaData, getPluginId } from "../../plugins/collect-plugins";
import { webpack5 } from "../../../types/webpack5";
import loader = webpack5.loader;

export type JoyPluginLoaderQuery = {
  middleware: string;
};

export const pluginLoaderOptions: {
  plugins: PluginMetaData[];
} = {
  plugins: [],
};

const joyPluginLoader: loader.Loader = function () {
  const { middleware }: JoyPluginLoaderQuery =
    typeof this.query === "string" ? parse(this.query.substr(1)) : this.query;

  const plugins = pluginLoaderOptions.plugins.filter((plugin) => {
    return plugin.middleware.includes(middleware);
  });

  const pluginIds: string[] = [];
  const pluginConfigs: any[] = [];

  return `
    ${plugins
      .map((plugin) => {
        const pluginId = getPluginId(plugin.pkgName);
        pluginIds.push(pluginId);
        pluginConfigs.push(plugin.config || {});
        return `import ${pluginId} from '${plugin.directory}/src/${middleware}'`;
      })
      .join("\n")}

    export default function (ctx) {
      return Promise.all([${pluginIds
        .map((id, idx) => `${id}(ctx, ${JSON.stringify(pluginConfigs[idx])})`)
        .join(",")}])
    }
  `;
};

export default joyPluginLoader;
