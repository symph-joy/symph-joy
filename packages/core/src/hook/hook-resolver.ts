import { Injectable } from "../decorators/core";
import { HookCenter } from "./hook-center";
import { InstanceWrapper } from "../injector/instance-wrapper";
import { InjectorHookTaps } from "../injector/injector";
import { getHooksMetadata } from "./hook.decorator";
import { getTapsMetadata, Tap } from "./tap.decorator";

// @Injectable()
export class HookResolver implements InjectorHookTaps {
  constructor(private pluginCenter: HookCenter) {
    pluginCenter.registerTap("injectorAfterPropertiesSet", {
      id: "plugin-center-resolve-hooks",
      propKey: "injectorAfterPropertiesSet",
      provider: this,
    });
  }

  injectorAfterPropertiesSet<T>(
    instance: T,
    args: { instanceWrapper: InstanceWrapper }
  ): T {
    const { instanceWrapper } = args;
    const hooks = getHooksMetadata(instanceWrapper.type);
    if (hooks && hooks.length > 0) {
      this.pluginCenter.registerProviderHooks(instance, instanceWrapper.type);
    }

    const taps = getTapsMetadata(instanceWrapper.type);
    if (taps && taps.length > 0) {
      this.pluginCenter.registerProviderTaps(instance, instanceWrapper.type);
    }

    return instance;
  }
}
