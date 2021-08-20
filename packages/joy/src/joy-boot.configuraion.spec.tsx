import { Configuration, Component, ProviderScanner } from "@symph/core";

import { JoyBoot } from "./joy-boot";
import { Command } from "./command/command.decorator";
import { ServerFactory } from "@symph/server";
import { JoyBootFactory } from "./joy-boot-factory";
import { Provider } from "@symph/core/dist/decorators/core/configuration/provider.decorator";
import { JoyBootConfiguration } from "./joy-boot.configuration";

describe("joy-boot.configuration", () => {
  test("Should get providers", async () => {
    const providerScanner = new ProviderScanner();
    const providers = await providerScanner.scan(JoyBootConfiguration);
    console.log(providers);
  });
});
