import {
  Scope,
  ScopeOptions,
} from "../../interfaces/context/scope-options.interface";
import { INJECTABLE_METADATA } from "../../constants";
import "reflect-metadata";
import { ClassProvider } from "../../interfaces";
import { providerNameGenerate } from "../../injector/provider-name-generate";

/**
 * Defines the injection scope.
 *
 * @publicApi
 */
export type InjectableOptions = ScopeOptions;

/**
 * Decorator that marks a class as a provider.
 * Providers can be injected into other classes via constructor parameter injection
 * using Joy's built-in [Dependency Injection (DI)](#)
 * system.
 *
 * When injecting a provider, it must be visible within the context.
 *
 * Providers can also be defined in a more explicit and imperative form using
 * various [custom provider](#) techniques that expose
 * more capabilities of the DI system.
 *
 * @param options options specifying scope of injectable
 *
 * @publicApi
 */
export function Injectable(
  options: Partial<ClassProvider> = {}
): ClassDecorator {
  return (target) => {
    const id = options.id || providerNameGenerate(options.type || target);
    const provider: ClassProvider = Object.assign(
      {
        id,
        type: target,
        useClass: target,
        scope: Scope.DEFAULT,
        autoReg: false,
      },
      options
    );

    Reflect.defineMetadata(INJECTABLE_METADATA, provider, target);
  };
}

export function getInjectableMeta(target: Object): ClassProvider {
  return Reflect.getMetadata(INJECTABLE_METADATA, target);
}
