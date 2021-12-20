import { Scope, Type } from "../../src/interfaces";
import { ComponentWrapper } from "../../src/injector/component-wrapper";
import { ApplicationContainer } from "../../src/injector";
import { componentNameGenerate } from "../../src/injector/component-name-generate";
import { getComponentMeta, TComponent } from "../../src";

export function createInstanceWrapper<T>(providerClazz: Type<T>, matedata?: Partial<ComponentWrapper>): ComponentWrapper<T> {
  return new ComponentWrapper({
    name: componentNameGenerate(providerClazz),
    type: providerClazz,
    instance: Object.create(providerClazz.prototype),
    scope: Scope.SINGLETON,
    isResolved: false,
    instanceBy: "class",
    // host: hostModule,
    ...matedata,
  });
}

export function registerComponents<T>(container: ApplicationContainer, ...providerDefines: (Type<any> | TComponent)[]): [...ComponentWrapper<any>[]] {
  const wrappers: any[] = [];
  if (providerDefines && providerDefines.length) {
    providerDefines.forEach((providerDefine) => {
      // let clz: Type<any>,
      //   providerMateData: Partial<ComponentWrapper> | undefined;
      // if (Array.isArray(providerClz)) {
      //   [clz, providerMateData] = providerClz;
      // } else {
      //   clz = providerClz;
      //   providerMateData = getInjectableMeta(providerClz);
      // }
      // const wrapper = createInstanceWrapper(clz, providerMateData);

      let meta: TComponent;
      if (typeof providerDefine === "function") {
        meta = getComponentMeta(providerDefine)!;
      } else {
        meta = providerDefine;
      }

      const wrapper = container.addProvider(meta);
      wrappers.push(wrapper);
      // container.providers.set(clz.name, wrapper)
      // container.addWrapper(wrapper);
    });
  }

  return [...wrappers];
}
