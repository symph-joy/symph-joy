import { Inject, Injectable, Optional } from "../decorators/core";
import { Scope } from "../interfaces";
import { JoyContainer } from "../injector";
import { InstanceWrapper } from "../injector/instance-wrapper";
import { Injector } from "../injector/injector";
import { createProviderWrappers } from "../../test/injector/helper";
import sinon from "sinon";
import { UnknownDependenciesException } from "../errors/exceptions/unknown-dependencies.exception";
import { InvalidDependencyTypeException } from "../errors/exceptions/invalid-dependency-type.exception";
import { HookCenter } from "../hook/hook-center";
import { NotUniqueMatchedProviderException } from "../errors/exceptions/not-unique-matched-provider.exception";

function instanceContainer(): JoyContainer {
  const container = new JoyContainer();
  const hookCenter = new HookCenter();
  hookCenter.registerProviderHooks(container, JoyContainer);
  return container;
}

describe("injector-scopes-static", () => {
  let injector: Injector;

  beforeAll(async () => {
    const pluginCenter = new HookCenter();
    injector = new Injector(pluginCenter);
  });

  afterAll(async () => {
    // no-op
  });

  describe("loadProvider", () => {
    describe("load class provider", () => {
      @Injectable({ scope: Scope.TRANSIENT })
      class TransProvider {}

      @Injectable({ scope: Scope.DEFAULT })
      class SingProvider {}

      @Injectable()
      class MainTest {
        @Inject()
        public prop: SingProvider;

        constructor(public singProvider: SingProvider) {}
      }

      let singProviderWrapper: InstanceWrapper<SingProvider>,
        transProviderWrapper: InstanceWrapper<TransProvider>,
        mainTestWrapper: InstanceWrapper<MainTest>,
        container: JoyContainer;

      beforeAll(async () => {
        container = new JoyContainer();
        // container = new Module(TestModule))
        transProviderWrapper = new InstanceWrapper({
          name: "transProvider",
          type: TransProvider,
          instance: Object.create(TransProvider.prototype),
          scope: Scope.TRANSIENT,
          isResolved: false,
        });
        singProviderWrapper = new InstanceWrapper({
          name: "singProvider",
          type: SingProvider,
          instance: Object.create(SingProvider.prototype),
          scope: Scope.DEFAULT,
          isResolved: false,
        });
        mainTestWrapper = new InstanceWrapper({
          name: "mainTest",
          type: MainTest,
          instance: Object.create(MainTest.prototype),
          isResolved: false,
        });
        container.addWrapper(transProviderWrapper);
        container.addWrapper(singProviderWrapper);
        container.addWrapper(mainTestWrapper);
      });

      test("should create a singleton instance of component", async () => {
        const singProvider = await injector.loadProvider(
          singProviderWrapper,
          container
        );
        expect(singProvider).not.toBeNull();
        expect(singProvider).toBeInstanceOf(SingProvider);
      });

      test("should return same instance of component when load twice", async () => {
        const provider1 = await injector.loadProvider(
          singProviderWrapper,
          container
        );
        const provider2 = await injector.loadProvider(
          singProviderWrapper,
          container
        );
        expect(provider1).toBe(provider2);
        expect(provider1).not.toBe(new SingProvider());
      });

      test("should create a transient instance of component", async () => {
        const provider = await injector.loadProvider(
          transProviderWrapper,
          container
        );
        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(TransProvider);
      });

      test("should create an instance of Component with proper dependencies", async () => {
        const mainTest = await injector.loadProvider(
          mainTestWrapper,
          container
        );
        expect(mainTest).toBeInstanceOf(MainTest);
        expect(mainTest.singProvider).toBeInstanceOf(SingProvider);
        expect(mainTest.prop).toBeInstanceOf(SingProvider);
        expect(mainTest.singProvider).toStrictEqual(mainTest.prop);
      });

      // transient
      test("should return different instances of component when load twice", async () => {
        const provider1 = await injector.loadProvider(
          transProviderWrapper,
          container
        );
        const provider2 = await injector.loadProvider(
          transProviderWrapper,
          container
        );
        expect(provider1).not.toBeNull();
        expect(provider2).not.toBeNull();
        expect(provider1).not.toBe(provider2);
      });

      test("should inject different instance into one hostInstance, when scope is SCOPE.TRANSIENT", async () => {
        @Injectable()
        class TransDepsMain {
          constructor(
            public transProvider1: TransProvider,
            public transProvider2: TransProvider
          ) {}
        }

        const transDepsMainWrapper = new InstanceWrapper<TransDepsMain>({
          name: "TransDepsMain",
          type: TransDepsMain,
          instance: Object.create(TransDepsMain.prototype),
          isResolved: false,
        });
        container.addWrapper(transDepsMainWrapper);

        const main = await injector.loadProvider(
          transDepsMainWrapper,
          container
        );
        expect(main).toBeInstanceOf(TransDepsMain);
        expect(main.transProvider1).not.toBeNull();
        expect(main.transProvider2).not.toBeNull();
        expect(main.transProvider1).not.toBe(main.transProvider2);
      });
    });

    describe("load factory provider", () => {
      test("should return the value created by factory", async () => {
        const container = new JoyContainer();

        class Provider1 {}
        let createInstance = undefined;
        const wrapper = container.addCustomFactory({
          id: "customFactory",
          type: Provider1,
          useFactory: () => {
            createInstance = new Provider1();
            return createInstance;
          },
          inject: [],
        });
        const instance = await injector.loadProvider(wrapper, container);

        expect(instance).toBeInstanceOf(Provider1);
        expect(instance === createInstance).toBeTruthy();
      });

      test("should return the value created by factory, with custom inject param.", async () => {
        const container = new JoyContainer();

        class Provider1 {
          constructor(public msg: string) {}
        }
        let createInstance = undefined;
        container.addCustomValue({
          id: "initMsg",
          type: String,
          useValue: "hello",
        });
        const wrapper = container.addCustomFactory({
          id: "customFactory",
          type: Provider1,
          useFactory: (initMsg: string) => {
            createInstance = new Provider1(initMsg);
            return createInstance;
          },
          inject: ["initMsg"],
        }) as InstanceWrapper<Provider1>;
        const instance = await injector.loadProvider(wrapper, container);

        expect(instance).toBeInstanceOf(Provider1);
        expect(instance === createInstance).toBeTruthy();
        expect(instance.msg).toBe("hello");
      });

      test("should return the value created by factory, with optional param.", async () => {
        const container = new JoyContainer();

        class Provider1 {
          constructor(public msg: string) {}
        }
        let createInstance = undefined;
        const wrapper = container.addCustomFactory({
          id: "customFactory",
          type: Provider1,
          useFactory: (initMsg: string | undefined) => {
            createInstance = new Provider1(initMsg || "defaultValue");
            return createInstance;
          },
          inject: [{ name: "initMsg", isOptional: true }],
        }) as InstanceWrapper<Provider1>;
        const instance = await injector.loadProvider(wrapper, container);

        expect(instance).toBeInstanceOf(Provider1);
        expect(instance === createInstance).toBeTruthy();
        expect(instance.msg).toBe("defaultValue");
      });
    });
  });

  describe("inject", () => {
    test("should inject undefined if the constructor param's type is not found and param is optional.", async () => {
      @Injectable()
      class Hello {}

      @Injectable()
      class HelloOptional {}

      @Injectable()
      class Main {
        @Optional()
        @Inject()
        public hello: Hello;

        @Optional()
        @Inject()
        public helloOptional: HelloOptional;
      }

      const container = new JoyContainer();
      const [mainWrapper, helloWrapper] = createProviderWrappers(
        container,
        Main,
        Hello
      );

      const instance = await injector.loadProvider<Main>(
        mainWrapper,
        container
      );
      expect(instance.hello).toBeInstanceOf(Hello);
      expect(instance.helloOptional).toBeUndefined();
    });

    test("should inject undefined if the property's type is not found and property is optional.", async () => {
      @Injectable()
      class Hello {}

      @Injectable()
      class HelloOptional {}

      @Injectable()
      class Main {
        constructor(
          @Optional() @Inject() public hello: Hello,
          @Optional() @Inject() public helloOptional: HelloOptional
        ) {}
      }

      const container = new JoyContainer();
      const [mainWrapper, helloWrapper] = createProviderWrappers(
        container,
        Main,
        Hello
      );

      const instance = await injector.loadProvider<Main>(
        mainWrapper,
        container
      );
      expect(instance.hello).toBeInstanceOf(Hello);
      expect(instance.helloOptional).toBeUndefined();
    });
  });

  describe("with sub class", () => {
    test("should return child instance when get by super class", async () => {
      @Injectable()
      class SuperClazz {}

      @Injectable()
      class Sub1 extends SuperClazz {}

      const container = new JoyContainer();
      const [subWrapper] = createProviderWrappers(container, Sub1);

      const wrapper = container.getProvider(SuperClazz);
      expect(wrapper?.type).toBe(Sub1);
      const instance = await injector.loadProvider<SuperClazz>(
        wrapper!,
        container
      );
      expect(instance).toBeInstanceOf(Sub1);
    });

    test("should rise an error, when super class more than one sub providers.", async () => {
      @Injectable()
      class SuperClazz {}

      @Injectable()
      class Sub1 extends SuperClazz {}

      @Injectable()
      class Sub2 extends SuperClazz {}

      const container = new JoyContainer();
      const [sub1Wrapper, sub2Wrapper] = createProviderWrappers(
        container,
        Sub1,
        Sub2
      );

      let err: Error | undefined = undefined;
      try {
        const wrapper = container.getProvider(SuperClazz);
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(NotUniqueMatchedProviderException);
    });
  });

  describe("injectBy", () => {
    it("should inject by provider name", async () => {
      @Injectable()
      class Dep {}

      @Injectable()
      class Main {
        constructor(@Inject("dep") public dep: Dep) {}
      }

      @Injectable()
      class WrongMain {
        constructor(@Inject("thisIsWrong") public dep: Dep) {}
      }

      const container = new JoyContainer();

      const [
        mainWrapper,
        depWrapper,
        wrongMainWrapper,
      ] = createProviderWrappers(container, Main, Dep, WrongMain);

      const instance = await injector.loadProvider<Main>(
        mainWrapper,
        container
      );
      expect(instance).toBeTruthy();
      expect(instance.dep).toBeInstanceOf(Dep);

      let error;
      try {
        await injector.loadProvider<Main>(wrongMainWrapper, container);
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error).toBeInstanceOf(UnknownDependenciesException);
    });

    it("should inject by provider type", async () => {
      @Injectable()
      class Dep {}

      @Injectable()
      class SubDep extends Dep {}

      @Injectable()
      class Main {
        constructor(
          @Inject(Dep) public constructorDep: Dep,
          @Inject(SubDep) public constructorSubDep: Dep
        ) {}

        @Inject(Dep)
        public propDep: Dep;

        @Inject(SubDep)
        public propSubDep: Dep;
      }

      const container = new JoyContainer();
      const [mainWrapper, depWrapper, subDepWrapper] = createProviderWrappers(
        container,
        Main,
        Dep,
        SubDep
      );

      const instance = await injector.loadProvider<Main>(
        mainWrapper,
        container
      );
      expect(instance).toBeTruthy();
      expect(instance.constructorDep).toBeInstanceOf(Dep);
      expect(instance.constructorSubDep).toBeInstanceOf(SubDep);
      expect(instance.propDep).toBeInstanceOf(Dep);
      expect(instance.propSubDep).toBeInstanceOf(SubDep);
    });

    it("should not set a obscure type to constructor argument type.", async () => {
      @Injectable()
      class Dep {
        save() {
          // no-op
        }
      }

      @Injectable()
      class Main {
        constructor(@Inject(Object) public constructorDep2: Dep) {}
      }

      const container = new JoyContainer();
      const [mainWrapper, depWrapper] = createProviderWrappers(
        container,
        Main,
        Dep
      );

      try {
        const instance = await injector.loadProvider<Main>(
          mainWrapper,
          container
        );
        throw new Error();
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDependencyTypeException);
      }
    });

    it("should throw an error, when the inject type not compatible with design type.", async () => {
      @Injectable()
      class Dep1 {
        save() {
          // no-op
        }
      }

      @Injectable()
      class Dep2 {
        save() {
          // no-op
        }
      }

      @Injectable()
      class Main {
        constructor(@Inject(Dep1) public constructorDep2: Dep2) {}
      }

      const container = new JoyContainer();
      const [mainWrapper, dep1Wrapper, dep2Wrapper] = createProviderWrappers(
        container,
        Main,
        Dep1,
        Dep2
      );

      try {
        const instance = await injector.loadProvider<Main>(
          mainWrapper,
          container
        );
        throw new Error();
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDependencyTypeException);
      }
    });

    it("should not inject superclass into subclass", async () => {
      class BaseDep {
        save() {
          // no-op
        }
      }

      @Injectable()
      class Dep extends BaseDep {
        save() {
          // no-op
        }
      }

      @Injectable()
      class Main {
        constructor(@Inject(BaseDep) public constructorDep2: Dep) {}
      }

      const container = new JoyContainer();
      const [mainWrapper, baseDepWrapper, depWrapper] = createProviderWrappers(
        container,
        Main,
        BaseDep,
        Dep
      );

      try {
        const instance = await injector.loadProvider<Main>(
          mainWrapper,
          container
        );
        throw new Error();
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDependencyTypeException);
      }
    });

    it("should inject by type and then by name", async () => {
      @Injectable()
      class Dep {}

      @Injectable()
      class SubDep1 extends Dep {}

      @Injectable()
      class SubDep2 extends Dep {}

      @Injectable()
      class Main {
        @Inject()
        public subDep2: Dep;
      }

      const container = new JoyContainer();
      const [mainWrapper, dep1Wrapper, dep2Wrapper] = createProviderWrappers(
        container,
        Main,
        SubDep1,
        SubDep2
      );
      const instance = await injector.loadProvider<Main>(
        mainWrapper,
        container
      );
      expect(instance).toBeTruthy();
      expect(instance.subDep2).toBeInstanceOf(SubDep2);
    });
  });

  describe("loadInstance-sync", () => {
    afterAll(async () => {
      // no-op
    });

    it("should get a plain object, when all dependencies is sync", async () => {
      const wrapper = new InstanceWrapper();

      @Injectable()
      class Dep1 {}

      @Injectable()
      class Dep2 {}

      @Injectable()
      class Main {
        constructor(public dep1: Dep1) {}

        @Inject()
        public dep2: Dep2;
      }

      const container = new JoyContainer();

      class TestModule {}

      const [
        dep1Wrapper,
        dep2Wrapper,
        mainWrapper,
      ] = createProviderWrappers(container, Dep1, Dep2, [
        Main,
        { scope: Scope.DEFAULT },
      ]);

      const instance = injector
        .loadInstance(mainWrapper, container)
        .getResult() as Main;

      expect(instance).toBeInstanceOf(Main);
      expect(instance.dep1).toBeInstanceOf(Dep1);
      expect(instance.dep2).toBeInstanceOf(Dep2);
    });

    it("should get a promise, when it is a async factory function", async () => {
      @Injectable()
      class Dep1 {}

      const container = new JoyContainer();
      const dep1ProviderWrapper = new InstanceWrapper({
        name: "dep1",
        type: Dep1,
        factory: async function () {
          return new Dep1();
        },
        inject: [],
        async: true,
        instance: undefined,
        scope: Scope.DEFAULT,
        isResolved: false,
      });
      container.addWrapper(dep1ProviderWrapper);

      const instance = injector
        .loadInstance(dep1ProviderWrapper, container)
        .getResult() as Promise<Dep1>;

      expect(instance).toBeInstanceOf(Promise);
      expect(await instance).toBeInstanceOf(Dep1);
    });

    it("should get a promise, when has a async dependency", async () => {
      @Injectable()
      class Dep1 {}

      @Injectable()
      class Main {
        constructor(@Inject() public dep1: Dep1) {}
      }

      const container = new JoyContainer();
      const [mainWrapper] = createProviderWrappers(container, Main);
      const dep1ProviderWrapper = new InstanceWrapper({
        name: "dep1",
        type: Dep1,
        factory: async function () {
          return new Dep1();
        },
        inject: [],
        async: true,
        instance: undefined,
        scope: Scope.DEFAULT,
        isResolved: false,
      });
      container.addWrapper(dep1ProviderWrapper);

      const loadResult = injector
        .loadInstance(mainWrapper, container)
        .getResult() as Promise<Main>;

      expect(loadResult).toBeInstanceOf(Promise);
      const instance = await loadResult;
      expect(instance).toBeInstanceOf(Main);
      expect(instance.dep1).toBeInstanceOf(Dep1);
    });
  });

  describe("loadCtorMetadata", () => {
    const sinonBox = sinon.createSandbox();
    afterAll(async () => {
      sinonBox.restore();
    });

    it("should resolve ctor metadata", async () => {
      @Injectable()
      class Dep1 {}

      @Injectable()
      class Dep2 {}

      @Injectable()
      class Main {
        constructor(public dep1: Dep1, public dep2: Dep2) {}
      }

      const container = new JoyContainer();

      const [
        dep1Wrapper,
        dep2Wrapper,
        mainWrapper,
      ] = createProviderWrappers(container, Dep1, Dep2, [
        Main,
        { scope: Scope.TRANSIENT },
      ]);

      const loadCtorMetadata = sinonBox.spy(injector, "loadCtorMetadata");

      const instance = (await injector.loadProvider(
        mainWrapper,
        container
      )) as Main;
      expect(instance).toBeTruthy();
      expect(loadCtorMetadata.notCalled).toBeTruthy();
      const instance1 = (await injector.loadProvider(
        mainWrapper,
        container
      )) as Main;
      expect(instance1).toBeTruthy();
      expect(loadCtorMetadata.calledOnce).toBeTruthy();
      expect(instance1.dep1).toBeInstanceOf(Dep1);
      expect(instance1.dep2).toBeInstanceOf(Dep2);
    });
  });

  describe("loadPropertiesMetadata", () => {
    const sinonBox = sinon.createSandbox();
    afterAll(async () => {
      sinonBox.restore();
    });

    it("should resolve properties metadata", async () => {
      @Injectable()
      class Dep1 {}

      @Injectable()
      class Dep2 {}

      @Injectable()
      class Main {
        @Inject()
        public dep1: Dep1;

        @Inject()
        public dep2: Dep2;
      }

      const container = new JoyContainer();

      const [
        dep1Wrapper,
        dep2Wrapper,
        mainWrapper,
      ] = createProviderWrappers(container, Dep1, Dep2, [
        Main,
        { scope: Scope.TRANSIENT },
      ]);

      const loadCtorMetadata = sinonBox.spy(injector, "loadPropertiesMetadata");

      const instance = (await injector.loadProvider(
        mainWrapper,
        container
      )) as Main;
      expect(instance).toBeTruthy();
      expect(loadCtorMetadata.notCalled).toBeTruthy();
      expect(instance.dep1).toBeInstanceOf(Dep1);
      expect(instance.dep2).toBeInstanceOf(Dep2);

      const instance1 = (await injector.loadProvider(
        mainWrapper,
        container
      )) as Main;
      expect(instance1).toBeTruthy();
      expect(loadCtorMetadata.calledOnce).toBeTruthy();
      expect(instance1.dep1).toBeInstanceOf(Dep1);
      expect(instance1.dep2).toBeInstanceOf(Dep2);
    });
  });

  describe("dynamicAddWrapper", () => {
    const sinonBox = sinon.createSandbox();
    afterAll(async () => {
      sinonBox.restore();
    });

    it("should not try to load a new wrapper", async () => {
      @Injectable()
      class Dep {}

      @Injectable()
      class Main {
        @Inject()
        public dep: Dep;
      }

      const container = new JoyContainer();

      const [mainWrapper, depWrapper] = createProviderWrappers(
        container,
        Main,
        Dep
      );

      const addProvider = sinonBox.spy(container, "addProvider");

      const instance = (await injector.loadProvider(
        mainWrapper,
        container
      )) as Main;
      expect(instance).toBeTruthy();
      expect(addProvider.notCalled).toBeTruthy();
      expect(instance.dep).toBeInstanceOf(Dep);
    });

    it("should dynamic loading the model instance, at run time", async () => {
      @Injectable({ autoLoad: true })
      class Dep {}

      @Injectable()
      class Main {
        @Inject()
        public dep: Dep;
      }

      const container = instanceContainer();

      const [mainWrapper] = createProviderWrappers(container, Main);

      const addProvider = sinonBox.spy(container, "addProvider");

      const instance = (await injector.loadProvider(
        mainWrapper,
        container
      )) as Main;
      expect(instance).toBeTruthy();
      expect(addProvider.calledOnce).toBeTruthy();
      expect(instance.dep).toBeInstanceOf(Dep);

      // try again
      const instance1 = (await injector.loadProvider(
        mainWrapper,
        container
      )) as Main;
      expect(instance1).toBeTruthy();
      expect(addProvider.calledOnce).toBeTruthy();
      expect(instance1.dep).toBeInstanceOf(Dep);
    });
  });

  describe("replaceProvider", () => {
    it("should replace a class provider", async () => {
      @Injectable()
      class Dep {
        getMessage() {
          return "message";
        }
      }

      @Injectable()
      class Dep1 {
        getMessage() {
          return "message1";
        }
      }

      const container = instanceContainer();

      createProviderWrappers(container, Dep);

      const depWrapper = container.getProvider(Dep)!;

      const instance = (await injector.loadProvider(
        depWrapper,
        container
      )) as Dep;
      expect(instance.getMessage()).toBe("message");

      container.replace("dep", { type: Dep1, useClass: Dep1 });
      const dep1Wrapper = container.getProvider(Dep)!;

      const instance1 = (await injector.loadProvider(
        dep1Wrapper,
        container
      )) as Dep;
      expect(instance1.getMessage()).toBe("message1");
    });
  });
});
