import { Component, ComponentWrapper, RuntimeException, ComponentName, TypeOrTokenType } from "@symph/core";

@Component()
export class MountService {
  private mountMap = new Map<ComponentName, string>();

  public setMount(mount: string, components: ComponentWrapper[]): void {
    if (components && components.length) {
      for (const component of components) {
        this.mountMap.set(component.name, mount);
      }
    }
  }

  public getMount(typeOrToken: TypeOrTokenType): string | undefined {
    let componentName: ComponentName;
    if (typeof typeOrToken === "string" || typeof typeOrToken === "symbol") {
      componentName = typeOrToken;
    } else {
      throw new RuntimeException("Get mount error: type should transform to component name");
    }
    if (componentName) {
      return this.mountMap.get(componentName);
    }
  }
}
