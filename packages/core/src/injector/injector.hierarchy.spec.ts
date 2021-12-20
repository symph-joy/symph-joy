import { Inject, Component, Configuration } from "../decorators/core";
import { EntryType, IApplicationContext, Scope } from "../interfaces";
import { ApplicationContainer } from "../injector";
import { ComponentWrapper } from "./component-wrapper";
import { Injector } from "../injector/injector";
import { HookCenter } from "../hook/hook-center";
import { ApplicationContext } from "../application-context";
import { registerComponents } from "../../test/injector/helper";
import sinon from "sinon";
import { UnknownDependenciesException } from "../errors/exceptions/unknown-dependencies.exception";
import { InvalidDependencyTypeException } from "../errors/exceptions/invalid-dependency-type.exception";
import { NotUniqueMatchedProviderException } from "../errors/exceptions/not-unique-matched-provider.exception";
import { createPackage } from "../package/package";

function createTestAppContext(entry?: EntryType[], parent?: IApplicationContext): [ApplicationContext, ApplicationContainer, Injector] {
  const context = new ApplicationContext(entry, parent);
  const container = context.container;
  // @ts-ignore
  const injector = context.injector;
  return [context, container, injector];
}

describe("Inject hierarchy", () => {
  test("Should get component for parent, if component is not exists in child context.", async () => {
    @Component()
    class Dep {}

    const [contextP, containerP, injectorP] = createTestAppContext();
    const [contextC, containerC, injectorC] = createTestAppContext([], contextP);
    const [depWrapper] = registerComponents(containerP, Dep);

    const depWrapperGetFromChild = containerC.getProvider(Dep);
    expect(depWrapperGetFromChild).toBe(undefined);

    const depWrapperGetFromParent = containerP.getProvider(Dep);
    expect(depWrapperGetFromParent).toBe(depWrapper);

    const dep = await injectorC.loadProvider(depWrapper);
    expect(dep).toBeInstanceOf(Dep);
  });

  describe("Override parent configuration", () => {
    class Base {
      public msg: string;
    }

    @Component({ name: "dep" })
    class DepP extends Base {
      msg = "parent";
    }

    @Configuration()
    class ConfigP {
      @Configuration.Component()
      public dep: DepP;
    }

    @Component()
    class DepC extends Base {
      msg = "child";
    }

    @Configuration()
    class ConfigC {
      @Configuration.Component()
      public dep: DepC;
    }

    let contextP: ApplicationContext, containerP: ApplicationContainer, injectorP: Injector;
    let contextC: ApplicationContext, containerC: ApplicationContainer, injectorC: Injector;
    beforeAll(async () => {
      [contextP, containerP, injectorP] = createTestAppContext();
      [contextC, containerC, injectorC] = createTestAppContext([], contextP);
      await contextP.loadModule(ConfigP);
      await contextC.loadModule(ConfigC);
    });

    test("Should parent context get it's own component.", async () => {
      const depPByName = await contextP.get("dep");
      expect(depPByName).toBeInstanceOf(DepP);
      const depPByType = await contextP.get(Base);
      expect(depPByType).toBeInstanceOf(DepP);
      expect(depPByName).toBe(depPByType);
    });

    test("Should child context get it's own component.", async () => {
      const depCByName = await contextC.get("dep");
      expect(depCByName).toBeInstanceOf(DepC);
      const depCByType = await contextC.get(Base);
      expect(depCByType).toBeInstanceOf(DepC);
      expect(depCByName).toBe(depCByType);
    });
  });

  test("Should inject parent component", async () => {
    class Base {
      public msg: string;
    }

    @Component({ name: "dep" })
    class DepP extends Base {
      msg = "parent";
    }

    @Configuration()
    class ConfigP {
      @Configuration.Component()
      public dep: DepP;
    }

    @Component()
    class MainC {
      constructor(public dep: Base) {}
    }

    @Configuration()
    class ConfigC {
      @Configuration.Component()
      public mainC: MainC;
    }

    let contextP: ApplicationContext, containerP: ApplicationContainer, injectorP: Injector;
    let contextC: ApplicationContext, containerC: ApplicationContainer, injectorC: Injector;

    [contextP, containerP, injectorP] = createTestAppContext();
    [contextC, containerC, injectorC] = createTestAppContext([], contextP);
    await contextP.loadModule(ConfigP);
    await contextC.loadModule(ConfigC);

    const mainC = await contextC.get("mainC");
    expect(mainC.dep).toBeInstanceOf(DepP);
  });
});
