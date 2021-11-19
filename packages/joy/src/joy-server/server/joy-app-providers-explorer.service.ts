import { Component, RegisterTap } from "@symph/core";
import { IScanOutModule } from "../../build/scanner/file-scanner";
import { handlebars } from "../../lib/handlebars";
import { readFileSync } from "fs";
import { join } from "path";
import { FileGenerator, IGenerateFiles } from "../../build/file-generator";
import { isReactComponent } from "@symph/react/dist/react-component.decorator";
import { ModuleContextTypeEnum } from "../../lib/constants";

@Component()
export class JoyAppProvidersExplorerService {
  protected moduleTemplate = handlebars.compile(readFileSync(join(__dirname, "./joy-app-providers-explorer.handlebars"), "utf-8"));

  protected lastGenerateContent: string | undefined;

  protected providerModules: IScanOutModule[] = [];

  constructor(protected fileGenerator: FileGenerator) {}

  public getModules(): IScanOutModule[] {
    return this.providerModules;
  }

  public setModules(providers: IScanOutModule[]): void {
    this.providerModules = providers;
  }

  public hasExist(modulePath: string): boolean {
    return !!this.providerModules.find((v) => v.path === modulePath);
  }

  public addModule(provider: IScanOutModule) {
    if (this.hasExist(provider.path as string)) {
      throw new Error(`provider (${JSON.stringify(provider)}) is exist`);
    }
    this.providerModules.push(provider);
  }

  public removeModule(modulePath: string): IScanOutModule | undefined {
    for (let i = 0; i < this.providerModules.length; i++) {
      const providerModule = this.providerModules[i];
      if (providerModule.path === modulePath) {
        this.providerModules.splice(i, 1);
        return providerModule;
      }
    }
  }

  protected addFromScanOutModule(module: IScanOutModule): boolean {
    if (module.contextType !== ModuleContextTypeEnum.Server || !module.providerDefines || module.providerDefines.size === 0) {
      return false;
    }
    let hasServerProvider = false;
    let hasReactProvider = false;
    module.providerDefines.forEach((providerDefine, exportKey) => {
      // /**
      //  * the item in position 0:
      //  * 1. when type is ClassProvider,it is the ClassProvider definition .
      //  * 2. when type is Configuration, it is the Configuration class's Component definition.
      //  */
      // const provider = providerDefine.providers[0];
      // (provider as ClassProvider).autoLoad === true ? (hasAutoLoadProvider = true) : (hasNotAutoLoadProvider = true);

      providerDefine.providers.forEach((provider, index) => {
        if (isReactComponent(provider.type)) {
          hasReactProvider = true;
        } else {
          hasServerProvider = true;
        }
        // (provider as ClassProvider).autoLoad === true ? (hasServerProvider = true) : (hasReactProvider = true);
      });
    });
    if (!hasServerProvider) {
      return false;
    }
    if (hasReactProvider) {
      throw new Error(`Module can not include server and react component. module path: ${module.resource || module.path}`);
    }
    if (!module.resource) {
      console.warn(`Server module(${module.path}) can not found resource code.`);
    }
    this.providerModules.push(module);
    return true;
  }

  @RegisterTap()
  public async afterScanOutModuleHook(module: IScanOutModule) {
    if (module.isAdd) {
      this.addFromScanOutModule(module);
    } else if (module.isModify) {
      this.removeModule(module.path);
      this.addFromScanOutModule(module);
    } else if (module.isRemove) {
      this.removeModule(module.path);
    }
  }

  // @RegisterTap()
  // public async onGenerateFiles(genFiles: IGenerateFiles) {
  //   const modules = this.providerModules.map((mod) => {
  //     return {
  //       ...mod,
  //       path: mod.resource || mod.path,
  //       providerKeys: mod.providerDefines?.keys(),
  //     };
  //   });
  //
  //   // const importModules = this.providerModules.reduce((pre , mod) => {
  //   //   // return {
  //   //   //   path: mod.resource,
  //   //   //   providerKeys: mod.providerDefines?.keys()
  //   //   // }
  //   //   if(!mod.resource) {
  //   //     return pre
  //   //   }
  //   //   pre[mod.resource] = `require("${mod.resource}")`
  //   //   return pre;
  //   // }, {} as Record<string, unknown>)
  //
  //   const moduleFileContent = this.moduleTemplate({modules});
  //   if (this.lastGenerateContent?.length === moduleFileContent.length && this.lastGenerateContent === moduleFileContent) {
  //     // Module has not changed， so should not update.
  //     return genFiles
  //   }
  //   this.lastGenerateContent = moduleFileContent
  //   // await this.fileGenerator.writeClientFile("./routes.js", clientFileContent);
  //   // await this.fileGenerator.writeJoyFile(
  //   //   "./app-providers.config.js",
  //   //   moduleFileContent
  //   // );
  //   genFiles["./joy/server-providers.config.js"] = moduleFileContent;
  //   return genFiles;
  // }
}
