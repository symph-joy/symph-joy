import { Type } from "../interfaces";
import { isNil, isSymbol } from "../utils/shared.utils";
import {
  InjectorDependency,
  InjectorDependencyContext,
} from "../injector/injector";

/**
 * Returns the name of an instance
 * @param instance The instance which should get the name from
 */
const getInstanceName = (instance: unknown) =>
  instance && (instance as Type<any>).name;

/**
 * Returns the name of the dependency
 * Tries to get the class name, otherwise the string value
 * (= injection token). As fallback it returns '+'
 * @param dependency The dependency whichs name should get displayed
 */
const getDependencyName = (dependency: InjectorDependency) =>
  // use class name
  getInstanceName(dependency) ||
  // use injection token (symbol)
  (isSymbol(dependency) && dependency.toString()) ||
  // use string directly
  dependency ||
  // otherwise
  "+";

export const UNKNOWN_DEPENDENCIES_MESSAGE = (
  type: string,
  unknownDependencyContext: InjectorDependencyContext
) => {
  const {
    index,
    name = "dependency",
    dependencies,
    key,
  } = unknownDependencyContext;
  const moduleName = "Module";

  let message = `Joy can't resolve dependencies of the ${type.toString()}`;

  // todo 说明导入provider的两个方式
  const potentialSolutions = `\n
Potential solutions:
- If ${name} is a provider, is it part of the current context?
- If ${name} is exported from a separate @Module, is that module imported within ${moduleName}?
  @Module({
    imports: [ /* the Module containing ${name} */ ]
  })
`;

  if (isNil(index)) {
    message += `. Please make sure that the "${key.toString()}" property is available in the current context.${potentialSolutions}`;
    return message;
  }
  const dependenciesName = (dependencies || []).map(getDependencyName);
  dependenciesName[index] = "?";

  message += ` (`;
  message += dependenciesName.join(", ");
  message += `). Please make sure that the argument ${type} at index [${index}] is available in the context.`;
  message += potentialSolutions;

  return message;
};

export const INVALID_MIDDLEWARE_MESSAGE = (
  text: TemplateStringsArray,
  name: string
) => `The middleware doesn't provide the 'use' method (${name})`;

export const INVALID_MODULE_MESSAGE = (
  text: TemplateStringsArray,
  scope: string
) =>
  `Joy cannot create the module instance. Often, this is because of a circular dependency between modules. Use forwardRef() to avoid it.
Scope [${scope}]
`;

export const UNKNOWN_EXPORT_MESSAGE = (token = "item", module: string) => {
  return `Joy cannot export a provider/module that is not a part of the currently processed module (${module}). Please verify whether the exported ${token} is available in this particular context.

Possible Solutions:
- Is ${token} part of the relevant providers/imports within ${module}?
`;
};

export const INVALID_CLASS_MESSAGE = (text: TemplateStringsArray, value: any) =>
  `ModuleRef cannot instantiate class (${value} is not constructable).`;

export const INVALID_PROVIDER_ID_MESSAGE = (
  text: TemplateStringsArray,
  value: any
) => `Cannot find provider named (${value}).`;

export const INVALID_CLASS_SCOPE_MESSAGE = (
  text: TemplateStringsArray,
  name: string | undefined
) =>
  `${
    name || "This class"
  } is marked as a scoped provider. Request and transient-scoped providers can't be used in combination with "get()" method. Please, use "resolve()" instead.`;

export const INVALID_EXCEPTION_FILTER = `Invalid exception filters (@UseFilters()).`;
