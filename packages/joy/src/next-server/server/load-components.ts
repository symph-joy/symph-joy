import { BUILD_MANIFEST, REACT_LOADABLE_MANIFEST } from "../lib/constants";
import { join } from "path";
import { requirePage } from "./require";
import { BuildManifest } from "./get-page-files";
import { AppType, DocumentType } from "../lib/utils";
import {
  PageConfig,
  GetStaticPaths,
  GetServerSideProps,
  GetStaticProps,
} from "../../types";
import { fileExists } from "../../lib/file-exists";

export function interopDefault(mod: any) {
  return mod.default || mod;
}

export type ManifestItem = {
  id: number | string;
  name: string;
  file: string;
};

type ReactLoadableManifest = { [moduleId: string]: ManifestItem[] };

export type LoadComponentsReturnType = {
  // Component: React.ComponentType
  pageConfig?: PageConfig;
  buildManifest: BuildManifest;
  reactLoadableManifest: ReactLoadableManifest;
  Document: DocumentType;
  App: AppType;
  // getStaticProps?: GetStaticProps
  // getStaticPaths?: GetStaticPaths
  // getServerSideProps?: GetServerSideProps
};

export async function loadComponents(
  distDir: string,
  pathname: string,
  serverless: boolean
): Promise<LoadComponentsReturnType> {
  // if (serverless) {
  //   const Component = await requirePage(pathname, distDir, serverless)
  //   const { getStaticProps, getStaticPaths, getServerSideProps } = Component
  //
  //   return {
  //     Component,
  //     pageConfig: Component.config || {},
  //     getStaticProps,
  //     getStaticPaths,
  //     getServerSideProps,
  //   } as LoadComponentsReturnType
  // }

  const DocumentMod = requirePage("/_document", distDir, serverless);
  const AppMod = requirePage("/_app", distDir, serverless);
  // const ComponentMod = requirePage(pathname, distDir, serverless) // todo 不在需要加载页面组件了，去掉该操作
  // const ComponentMod = requirePage('/_app', distDir, serverless) // todo 不在需要加载页面组件了，去掉该操作。 先用_app占位， 后续流程中已经不在需要ComponentMod了

  const genServerModulesPath = join(distDir, "./server/gen-server-modules.js");
  const requireGenModules = async () => {
    if (await fileExists(genServerModulesPath)) {
      const modules = require(genServerModulesPath);
      return modules.default || modules;
    } else {
      return [];
    }
  };

  const [
    buildManifest,
    reactLoadableManifest,
    // Component,
    Document,
    App,
  ] = await Promise.all([
    require(join(distDir, BUILD_MANIFEST)),
    require(join(distDir, REACT_LOADABLE_MANIFEST)),
    // interopDefault(ComponentMod),
    interopDefault(DocumentMod),
    interopDefault(AppMod),
  ]);

  // const { getServerSideProps, getStaticProps, getStaticPaths } = ComponentMod

  return {
    App,
    Document,
    // Component,
    buildManifest,
    reactLoadableManifest,
    // pageConfig: ComponentMod.config || {},
    // getServerSideProps,
    // getStaticProps,
    // getStaticPaths,
  };
}
