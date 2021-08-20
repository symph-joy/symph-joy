import { Component } from "../component.decorator";
import { Configuration } from "./configuration.decorator";
import { Provider } from "./provider.decorator";
import { CoreContextFactory } from "../../../core-context-factory";
import { ProviderLifecycle } from "../../../interfaces";
import { ProviderScanner } from "../../../injector/provider-scanner";

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
});
