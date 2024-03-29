export const METADATA = {
  INJECTABLE: "injectable",
  IMPORTS: "imports",
  PROVIDERS: "providers",
  CONTROLLERS: "controllers",
  EXPORTS: "exports",
};

// === core
export const NAMESPACE_SEP = "/";

// === application
export const MESSAGES = {
  APPLICATION_START: `Starting Joy application...`,
  APPLICATION_READY: `Joy application successfully started`,
  MICROSERVICE_READY: `Joy microservice successfully started`,
  UNKNOWN_EXCEPTION_MESSAGE: "Internal server error",
  ERROR_DURING_SHUTDOWN: "Error happened during shutdown",
  CALL_LISTEN_FIRST: "app.listen() needs to be called before calling app.getUrl()",
};

export const APP_INTERCEPTOR = "APP_INTERCEPTOR";
export const APP_PIPE = "APP_PIPE";
export const APP_GUARD = "APP_GUARD";
export const APP_FILTER = "APP_FILTER";

//=== common
export const INJECTABLE_METADATA = "__joy_injectable";
export const CONFIGURATION_METADATA = "__joy_config";

export const SHARED_MODULE_METADATA = "__module:shared__";
export const GLOBAL_MODULE_METADATA = "__module:global__";
export const PATH_METADATA = "path";
export const PARAMTYPES_METADATA = "design:paramtypes";
export const SELF_DECLARED_DEPS_METADATA = "self:paramtypes";
export const OPTIONAL_DEPS_METADATA = "optional:paramtypes";
export const PROPERTY_DEPS_METADATA = "self:properties_metadata";
export const OPTIONAL_PROPERTY_DEPS_METADATA = "optional:properties_metadata";
export const SCOPE_OPTIONS_METADATA = "scope:options";

export const METHOD_METADATA = "method";
export const ROUTE_ARGS_METADATA = "__routeArguments__";
export const CUSTOM_ROUTE_AGRS_METADATA = "__customRouteArgs__";
export const EXCEPTION_FILTERS_METADATA = "__exceptionFilters__";
export const FILTER_CATCH_EXCEPTIONS = "__filterCatchExceptions__";
export const PIPES_METADATA = "__pipes__";
export const GUARDS_METADATA = "__guards__";
export const RENDER_METADATA = "__renderTemplate__";
export const INTERCEPTORS_METADATA = "__interceptors__";
export const HTTP_CODE_METADATA = "__httpCode__";
export const MODULE_PATH = "__module_path__";
export const HEADERS_METADATA = "__headers__";
export const REDIRECT_METADATA = "__redirect__";
