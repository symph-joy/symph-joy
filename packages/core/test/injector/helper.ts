import { Scope, Type } from "../../src/interfaces";
import { InstanceWrapper } from "../../src/injector/instance-wrapper";
import { CoreContainer } from "../../src/injector";
import { providerNameGenerate } from "../../src/injector/provider-name-generate";
import { getInjectableMeta, Provider } from "../../src";

export function createInstanceWrapper<T>(providerClazz: Type<T>, matedata?: Partial<InstanceWrapper>): InstanceWrapper<T> {
  return new InstanceWrapper({
    name: [providerNameGenerate(providerClazz)],
    type: providerClazz,
    instance: Object.create(providerClazz.prototype),
    scope: Scope.DEFAULT,
    isResolved: false,
    instanceBy: "class",
    // host: hostModule,
    ...matedata,
  });
}

export function createProviderWrappers<T>(container: CoreContainer, ...providerDefines: (Type<any> | Provider)[]): [...InstanceWrapper<any>[]] {
  const wrappers: any[] = [];
  if (providerDefines && providerDefines.length) {
    providerDefines.forEach((providerDefine) => {
      // let clz: Type<any>,
      //   providerMateData: Partial<InstanceWrapper> | undefined;
      // if (Array.isArray(providerClz)) {
      //   [clz, providerMateData] = providerClz;
      // } else {
      //   clz = providerClz;
      //   providerMateData = getInjectableMeta(providerClz);
      // }
      // const wrapper = createInstanceWrapper(clz, providerMateData);

      let meta: Provider;
      if (typeof providerDefine === "function") {
        meta = getInjectableMeta(providerDefine)!;
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
