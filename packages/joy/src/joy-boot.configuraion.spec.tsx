import { ProviderScanner } from "@symph/core";
import { JoyBootConfiguration } from "./joy-boot.configuration";

describe("joy-boot.configuration", () => {
  test("Should get providers", async () => {
    const providerScanner = new ProviderScanner();
    const providers = await providerScanner.scan(JoyBootConfiguration);
    console.log(providers);
  });
});
