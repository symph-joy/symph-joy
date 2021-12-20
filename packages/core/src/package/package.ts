import "reflect-metadata";
import { getComponentMeta, getConfigurationMeta } from "../decorators";
import { getConfigurationComponents } from "../decorators/core/configuration/configuration-component.decorator";

const PACKAGE_METADATA = "__joy_package";

export function getPackageMeta(target: Object): PackageMeta {
  return Reflect.getOwnMetadata(PACKAGE_METADATA, target);
}

export interface PackageMeta {
  name: string;
  isPublic: boolean;
}

export class Package {
  constructor(public readonly name: string) {}

  public Package(): ClassDecorator {
    return (target) => {
      const compMeta = getComponentMeta(target, true);
      if (!compMeta) {
        throw new Error(`The class (class:${target.name}) which decorated by @Package must be a Component or Configuration.`);
      }
      const configMeta = getConfigurationMeta(target);
      if (configMeta) {
        this.packageConfigurationClass(target);
      }

      const exist = getPackageMeta(target);
      if (exist) {
        throw new Error(`Should not override package info on class(${target.name}), exist package:${exist}, newPackage: ${this.name}.`);
      }
      compMeta.package = this.name;
      Reflect.defineMetadata(PACKAGE_METADATA, { name: this.name } as PackageMeta, target);
    };
  }

  private packageConfigurationClass(target: Function) {
    const components = getConfigurationComponents(target);
    if (!components || components.length === 0) {
      return;
    }
    components.forEach((component) => {
      if (!component.package) {
        component.package = this.name;
      }
    });
  }
}

export function createPackage(name: string): Package {
  return new Package(name);
}
