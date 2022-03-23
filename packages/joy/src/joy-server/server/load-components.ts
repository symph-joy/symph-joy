import { BUILD_MANIFEST, REACT_LOADABLE_MANIFEST } from "../lib/constants";
import { join } from "path";
import { requirePage } from "./require";
import { BuildManifest } from "./get-page-files";
import { DocumentType } from "../lib/utils";
import { PageConfig } from "../../types";

export function interopDefault(mod: any) {
  return mod?.default || mod;
}

export type ManifestItem = {
  id: number | string;
  files: string[];
};

type ReactLoadableManifest = { [moduleId: string]: ManifestItem };

export type LoadComponentsReturnType = {
  Component?: React.ComponentType<any>;
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

export async function loadComponents(distDir: string, pathname: string | undefined, serverless: boolean): Promise<LoadComponentsReturnType> {
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
  const ComponentMod = pathname ? requirePage(pathname, distDir) : undefined;

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
