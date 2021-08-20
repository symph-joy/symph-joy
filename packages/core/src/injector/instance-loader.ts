import { Logger } from "../services/logger.service";
import { Scope } from "../interfaces";
import { CoreContainer } from "./core-container";
import { Injector } from "./injector";
import { STATIC_CONTEXT } from "./constants";
import { InstanceWrapper } from "./instance-wrapper";

export class InstanceLoader {
  private readonly logger = new Logger(InstanceLoader.name, true);

  constructor(private readonly container: CoreContainer, private readonly injector: Injector) {}

  public async createInstancesOfDependencies(instanceWrappers: InstanceWrapper[]): Promise<unknown[]> {
    // const wrappers = [] as InstanceWrapper[]
    for (const wrapper of instanceWrappers) {
      // const wrapper = this.container.getProviderById(id)!;
      wrapper.createPrototype(STATIC_CONTEXT);
      // wrappers.push(wrapper)
    }
    return this.createInstancesOfProviders(instanceWrappers);
  }

  private async createInstancesOfProviders(wrappers: InstanceWrapper[]): Promise<unknown[]> {
    const promises = [];
    for (const wrapper of wrappers) {
      if (wrapper.scope !== Scope.DEFAULT) {
        continue;
      }
      const provider = this.injector.loadProvider(wrapper, this.container);
      promises.push(provider);
    }
    return Promise.all(promises);
  }
}
