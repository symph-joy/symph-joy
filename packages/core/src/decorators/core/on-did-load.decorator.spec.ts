import { Component } from "./component.decorator";
import { Configuration } from "./configuration/configuration.decorator";
import { ProviderScanner } from "../../injector/provider-scanner";
import { getOnDidLoadMethodKey, OnDidLoad } from "./on-did-load.decorator";

describe("on-did-load.decorator", () => {
  test("Should get the onDidLoad method key.", async () => {
    @Component()
    class P1 {
      @OnDidLoad()
      onDidLoad() {}
    }

    const callbackMethodKey = getOnDidLoadMethodKey(P1);
    expect(callbackMethodKey).toBe("onDidLoad");
  });

  test("Should get the onDidLoad method key on super class.", async () => {
    class P1 {
      @OnDidLoad()
      onDidLoad() {}
    }

    @Component()
    class P2 extends P1 {
      onDidLoad() {}
    }

    const callbackMethodKey = getOnDidLoadMethodKey(P2);
    expect(callbackMethodKey).toBe("onDidLoad");
  });

  test("Should throw an error, when defined duplicate onDidLoad method.", async () => {
    let err;
    try {
      class P1 {
        @OnDidLoad()
        onDidLoad1() {}

        @OnDidLoad()
        onDidLoad2() {}
      }
    } catch (e) {
      err = e;
    }
    expect(err).toBeTruthy();
    expect(err.message).toContain("Duplicate define @OnDidLoad()");
  });
});
