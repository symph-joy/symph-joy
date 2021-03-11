import { Scope, Type } from "../../src/interfaces";
import { InstanceWrapper } from "../../src/injector/instance-wrapper";
import { JoyContainer } from "../../src/injector";
import { providerNameGenerate } from "../../src/injector/provider-name-generator";

export function createInstanceWrapper<T>(
  providerClazz: Type<T>,
  matedata?: Partial<InstanceWrapper>
): InstanceWrapper<T> {
  return new InstanceWrapper({
    name: providerNameGenerate(providerClazz),
    type: providerClazz,
    instance: Object.create(providerClazz.prototype),
    scope: Scope.DEFAULT,
    isResolved: false,
    instanceBy: "class",
    // host: hostModule,
    ...matedata,
  });
}

export function createProviderWrappers<T>(
  container: JoyContainer,
  ...providerClazzes: (Type<any> | [Type<any>, any])[]
): [...InstanceWrapper<any>[]] {
  const wrappers: any[] = [];
  if (providerClazzes && providerClazzes.length) {
    providerClazzes.forEach((providerClz) => {
      let clz: Type<any>,
        providerMateData: Partial<InstanceWrapper> | undefined;
      if (Array.isArray(providerClz)) {
        [clz, providerMateData] = providerClz;
      } else {
        clz = providerClz;
        providerMateData = undefined;
      }
      const wrapper = createInstanceWrapper(clz, providerMateData);
      wrappers.push(wrapper);
      // container.providers.set(clz.name, wrapper)
      container.addWrapper(wrapper);
    });
  }

  return [...wrappers];
}
