import { HookCenter } from "./hook-center";
import { ComponentWrapper } from "../injector/component-wrapper";
import { InjectorHookTaps } from "../injector/injector";
import { getTapsMetadata } from "./register-tap.decorator";
import { Scope } from "../interfaces";

export class HookResolver implements InjectorHookTaps {
  constructor(private pluginCenter: HookCenter) {
    pluginCenter.registerTap("onComponentRegisterAfter", {
      id: "plugin-center-resolve-hooks-register-hook",
      propKey: "onComponentRegisterAfter",
      provider: this,
    });
    pluginCenter.registerTap("componentAfterInitialize", {
      id: "plugin-center-resolve-hooks-register-component",
      propKey: "componentAfterInitialize",
      provider: this,
    });
  }

  onComponentRegisterAfter(componentWrapper: ComponentWrapper): ComponentWrapper {
    this.pluginCenter.registerHooksFromWrapper(componentWrapper);
    return componentWrapper;
  }

  componentAfterInitialize<T>(instance: T, args: { instanceWrapper: ComponentWrapper }): T {
    const { instanceWrapper } = args;
    if (instanceWrapper.scope === Scope.DEFAULT) {
      this.pluginCenter.registerProviderHooks(instance, instanceWrapper.type);
    }

    const taps = getTapsMetadata(instanceWrapper.type);
    if (taps && taps.length > 0) {
      this.pluginCenter.registerProviderTaps(instance, instanceWrapper.type);
    }

    return instance;
  }
}
