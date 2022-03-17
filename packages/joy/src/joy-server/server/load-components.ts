import { BUILD_MANIFEST, REACT_LOADABLE_MANIFEST } from "../lib/constants";
import { join } from "path";
import { requirePage } from "./require";
import { BuildManifest } from "./get-page-files";
import { DocumentType } from "../lib/utils";
import { PageConfig } from "../../types";

export function interopDefault(mod: any) {
  return mod.default || mod;
}

export type ManifestItem = {
  id: number | string;
  files: string[];
};

type ReactLoadableManifest = { [moduleId: string]: ManifestItem };

export type LoadComponentsReturnType = {
  Component: React.ComponentType<any>;
  pageConfig?: PageConfig;
  buildManifest: BuildManifest;
  reactLoadableManifest: ReactLoadableManifest;
  Document: DocumentType;
  // App: TReactAppComponent;
  // getStaticProps?: GetStaticProps
  // getStaticPaths?: GetStaticPaths
  // getServerSideProps?: GetServerSideProps
};

export function loadComponent<T = any>(distDir: string, pathname: string): T {
  return requirePage(pathname, distDir);
}

export async function loadComponents(distDir: string, pathname: string, serverless: boolean): Promise<LoadComponentsReturnType> {
  // if (serverless) {
  //   const Component = await requirePage(pathname, outDir, serverless)
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

  const DocumentMod = requirePage("/_document", distDir);
  // const AppMod = requirePage("/_app", distDir);
  const ComponentMod = requirePage(pathname, distDir); // todo 不在需要加载页面组件了，去掉该操作
  // const ComponentMod = requirePage('/_app', outDir, serverless) // todo 不在需要加载页面组件了，去掉该操作。 先用_app占位， 后续流程中已经不在需要ComponentMod了

  const [
    buildManifest,
    reactLoadableManifest,
    Component,
    Document,
    // App,
  ] = await Promise.all([
    require(join(distDir, BUILD_MANIFEST)),
    require(join(distDir, REACT_LOADABLE_MANIFEST)),
    interopDefault(ComponentMod),
    interopDefault(DocumentMod),
    // interopDefault(AppMod),
  ]);

  // const { getServerSideProps, getStaticProps, getStaticPaths } = ComponentMod

  return {
    // App,
    Document,
    Component,
    buildManifest,
    reactLoadableManifest,
    // pageConfig: ComponentMod.config || {},
    // getServerSideProps,
    // getStaticProps,
    // getStaticPaths,
  };
}
