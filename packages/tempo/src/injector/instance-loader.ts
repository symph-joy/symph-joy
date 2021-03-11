import { Logger } from "../services";
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

  public async createInstancesOfDependencies() {
    const names = this.container.getProviderNames();
    for (const name of names) {
      const wrapper = this.container.getProvider(name);
      wrapper.createPrototype(STATIC_CONTEXT);
    }

    await this.createInstancesOfProviders(this.container);
  }

  private async createInstancesOfProviders(container: JoyContainer) {
    const names = container.getProviderNames();
    const promises = [];
    for (const name of names) {
      const provider = container.getProvider(name);
      if (provider.scope !== Scope.DEFAULT) {
        continue;
      }
      promises.push(this.injector.loadProvider(provider, container));
    }
    await Promise.all(promises);
  }
}
