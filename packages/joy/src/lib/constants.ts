import { join } from "path";

export enum ModuleContextTypeEnum {
  React = "React",
  Server = "Server",
}

export const PROVIDER_ID_RUN_ARGS = "joyRunArgs";
export const JOY_PROJECT_ROOT = join(__dirname, "..");
export const JOY_PROJECT_ROOT_DIST = join(JOY_PROJECT_ROOT, "");
export const JOY_PROJECT_ROOT_NODE_MODULES = join(JOY_PROJECT_ROOT, "node_modules");
export const JOY_PROJECT_ROOT_DIST_CLIENT = join(JOY_PROJECT_ROOT_DIST, "client");
export const JOY_PROJECT_ROOT_DIST_SERVER = join(JOY_PROJECT_ROOT_DIST, "server");

// Regex for API routes
export const API_ROUTE = /^\/api(?:\/|$)/;

// Because on Windows absolute paths in the generated code can break because of numbers, eg 1 in the path,
// we have to use a private alias
export const PAGES_DIR_ALIAS = "private-joy-pages";
export const DOT_JOY_ALIAS = "private-dot-joy";

export const PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_joy' folder inside of your public folder. This conflicts with the internal '/_joy' route.`;

export const SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`;

export const SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`;

export const SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`;

export const PAGES_404_GET_INITIAL_PROPS_ERROR = `\`pages/404\` can not have getInitialProps/getServerSideProps.`;

export const SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported.`;

export const GSP_NO_RETURNED_VALUE = "Your `getStaticProps` function did not return an object. Did you forget to add a `return`?";
export const GSSP_NO_RETURNED_VALUE = "Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?";

export const UNSTABLE_REVALIDATE_RENAME_ERROR = "The `unstable_revalidate` property is available for general use.\n" + "Please use `revalidate` instead.";

export const GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page.`;

export const NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against.`;

export const SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported.`;
