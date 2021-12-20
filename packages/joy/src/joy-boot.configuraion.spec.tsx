import { ComponentScanner } from "@symph/core";
import { JoyBootConfiguration } from "./joy-boot.configuration";

describe("joy-boot.configuration", () => {
  test("Should get providers", async () => {
    const componentScanner = new ComponentScanner();
    const providers = await componentScanner.scan(JoyBootConfiguration);
    console.log(providers);
  });
});
