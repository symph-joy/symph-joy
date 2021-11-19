import { Logger } from "../services/logger.service";
import { Scope } from "../interfaces";
import { CoreContainer } from "./core-container";
import { Injector } from "./injector";
import { STATIC_CONTEXT } from "./constants";
import { ComponentWrapper } from "./component-wrapper";

export class InstanceLoader {
  private readonly logger = new Logger(InstanceLoader.name, true);

  constructor(private readonly container: CoreContainer, private readonly injector: Injector) {}

  public async createInstancesOfDependencies(instanceWrappers: ComponentWrapper[]): Promise<unknown[]> {
    // const wrappers = [] as ComponentWrapper[]
    for (const wrapper of instanceWrappers) {
      // const wrapper = this.container.getProviderById(id)!;
      wrapper.createPrototype(STATIC_CONTEXT);
      // wrappers.push(wrapper)
    }
    return this.createInstancesOfProviders(instanceWrappers);
  }

  private async createInstancesOfProviders(wrappers: ComponentWrapper[]): Promise<unknown[]> {
    const promises = [];
    for (const wrapper of wrappers) {
      if (wrapper.scope !== Scope.DEFAULT) {
        continue;
      }
      const provider = this.injector.loadProvider(wrapper);
      promises.push(provider);
    }
    return Promise.all(promises);
  }
}
