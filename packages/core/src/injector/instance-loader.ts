import { Logger } from "../services/logger.service";
import { Scope } from "../interfaces";
import { JoyContainer } from "./joy-container";
import { Injector } from "./injector";
import { STATIC_CONTEXT } from "./constants";

export class InstanceLoader {
  private readonly logger = new Logger(InstanceLoader.name, true);

  constructor(
    private readonly container: JoyContainer,
    private readonly injector: Injector
  ) {}

  public async createInstancesOfDependencies(providerNames: string[]) {
    // const names = this.container.getProviderNames();
    for (const name of providerNames) {
      const wrapper = this.container.getProvider(name)!;
      wrapper.createPrototype(STATIC_CONTEXT);
    }

    await this.createInstancesOfProviders(providerNames);
  }

  private async createInstancesOfProviders(providerNames: string[]) {
    // const names = this.container.getProviderNames();
    const promises = [];
    for (const name of providerNames) {
      const providerWrapper = this.container.getProvider(name)!;
      if (providerWrapper.scope !== Scope.DEFAULT) {
        continue;
      }
      const provider = this.injector.loadProvider(
        providerWrapper,
        this.container
      );
      promises.push(provider);
    }
    await Promise.all(promises);
  }
}
