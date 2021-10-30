import { Component } from "../component.decorator";
import { Configuration } from "./configuration.decorator";
import { ProviderScanner } from "../../../injector/provider-scanner";
import { createPackage } from "../../../package/package";

describe("configuration.decorator", () => {
  test("Should merge super class config mete data.", async () => {
    @Component()
    class P1 {}

    @Component()
    class P2 {}

    @Configuration({ imports: { P1 } })
    class A {}

    @Configuration({ imports: { P2 } })
    class B extends A {}

    const scanner = new ProviderScanner();
    const providers = scanner.scan(B);
    expect(providers.find((it) => it.type === P1)).toBeTruthy();
    expect(providers.find((it) => it.type === P2)).toBeTruthy();
    expect(providers.find((it) => it.type === B)).toBeTruthy();
  });

  test("Should override super class config mete data.", async () => {
    @Component()
    class P1 {}

    @Component()
    class P2 extends P1 {}

    @Configuration({ imports: { p: P1 } })
    class A {}

    @Configuration({ imports: { p: P2 } })
    class B extends A {}

    const scanner = new ProviderScanner();
    const providers = scanner.scan(B);
    expect(providers.find((it) => it.type === P1)).not.toBeTruthy();
    expect(providers.find((it) => it.type === P2)).toBeTruthy();
    expect(providers.find((it) => it.type === B)).toBeTruthy();
  });

  test("Should define package on all defined components.", async () => {
    const pk1 = createPackage("pk1");

    class P1 {}

    class P2 {}

    @pk1.Package()
    @Configuration()
    class Config {
      @Configuration.Provider({ global: true })
      public p1(): P1 {
        return new P1();
      }

      @Configuration.Provider()
      public p2(): P2 {
        return new P2();
      }
    }

    const scanner = new ProviderScanner();
    const providers = scanner.scan(Config);
    const dp1 = providers.find((it) => it.type === P1);
    const dp2 = providers.find((it) => it.type === P2);
    expect(dp1!.package).toBe("pk1");
    expect(dp1!.global).toBeTruthy();
    expect(dp2!.package).toBe("pk1");
    expect(dp2!.global).toBeFalsy();
  });
});
