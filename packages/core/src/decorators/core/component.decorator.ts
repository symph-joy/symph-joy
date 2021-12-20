import { Scope } from "../../interfaces/context/scope-options.interface";
import { INJECTABLE_METADATA } from "../../constants";
import "reflect-metadata";
import { ClassComponent, ComponentName } from "../../interfaces";
import { componentNameGenerate } from "../../injector/component-name-generate";

/**
 * Defines the injection scope.
 *
 * @publicApi
 */
export type ComponentOptions = {
  /**
   * provider name
   */
  name?: ComponentName;

  /**
   * Optional enum defining lifetime of the provider that is injected.
   */
  scope?: Scope;

  /**
   * 如果为false，只有通过明确的包名，才能找到该Component.
   * 依赖注入时，只指定了被依赖的组件名称，只有在同一个包名下，或者全局公开同名的组件，才能被注入。
   */
  global?: boolean;

  /**
   * alias array
   */
  alias?: ComponentName[];

  /**
   * 通过类型依赖注入时，如果未在容器中注册，是否自动注册组件，并获取实例。
   */
  lazyRegister?: boolean;
};

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
 * @param options options specifying scope of component
 *
 * @publicApi
 */
export function Component(options: ComponentOptions = {}): ClassDecorator {
  return (target) => {
    const name = options.name || componentNameGenerate(target);
    const provider: ClassComponent = Object.assign(
      {
        name,
        type: target,
        useClass: target,
        scope: Scope.SINGLETON,
        lazyRegister: false,
        global: true,
      },
      options
    );
    Reflect.defineMetadata(INJECTABLE_METADATA, provider, target);
  };
}

export function getComponentMeta(target: Object, ownMeta = true): ClassComponent | undefined {
  if (ownMeta) {
    return Reflect.getOwnMetadata(INJECTABLE_METADATA, target);
  } else {
    return Reflect.getMetadata(INJECTABLE_METADATA, target);
  }
}
