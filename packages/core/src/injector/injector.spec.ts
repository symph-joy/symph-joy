import { Autowire, Component, Optional } from "../decorators/core";
import { IComponentLifecycle, Scope } from "../interfaces";
import { CoreContainer } from "../injector";
import { ComponentWrapper } from "./component-wrapper";
import { Injector } from "../injector/injector";
import { registerComponents } from "../../test/injector/helper";
import sinon from "sinon";
import { UnknownDependenciesException } from "../errors/exceptions/unknown-dependencies.exception";
import { InvalidDependencyTypeException } from "../errors/exceptions/invalid-dependency-type.exception";
import { HookCenter } from "../hook/hook-center";
import { NotUniqueMatchedProviderException } from "../errors/exceptions/not-unique-matched-provider.exception";
import { createPackage } from "../package/package";

function instanceTestContainer(): CoreContainer {
  const container = new CoreContainer();
  const hookCenter = new HookCenter();
  hookCenter.registerProviderHooks(container);
  return container;
}

describe("injector", () => {
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
      @Component({ scope: Scope.TRANSIENT })
      class TransProvider {}

      @Component({ scope: Scope.DEFAULT })
      class SingProvider {}

      @Component()
      class MainTest {
        @Autowire()
        public prop: SingProvider;

        constructor(public singProvider: SingProvider) {}
      }

      let singProviderWrapper: ComponentWrapper<SingProvider>, transProviderWrapper: ComponentWrapper<TransProvider>, mainTestWrapper: ComponentWrapper<MainTest>, container: CoreContainer;

      beforeAll(async () => {
        container = instanceTestContainer();
        transProviderWrapper = new ComponentWrapper({
          name: "transProvider",
          type: TransProvider,
          instance: Object.create(TransProvider.prototype),
          scope: Scope.TRANSIENT,
          isResolved: false,
        });
        singProviderWrapper = new ComponentWrapper({
          name: "singProvider",
          type: SingProvider,
          instance: Object.create(SingProvider.prototype),
          scope: Scope.DEFAULT,
          isResolved: false,
        });
        mainTestWrapper = new ComponentWrapper({
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
        const singProvider = await injector.loadProvider(singProviderWrapper, container);
        expect(singProvider).not.toBeNull();
        expect(singProvider).toBeInstanceOf(SingProvider);
      });

      test("should return same instance of component when load twice", async () => {
        const provider1 = await injector.loadProvider(singProviderWrapper, container);
        const provider2 = await injector.loadProvider(singProviderWrapper, container);
        expect(provider1).toBe(provider2);
        expect(provider1).not.toBe(new SingProvider());
      });

      test("should create a transient instance of component", async () => {
        const provider = await injector.loadProvider(transProviderWrapper, container);
        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(TransProvider);
      });

      test("should create an instance of Component with proper dependencies", async () => {
        const mainTest = await injector.loadProvider(mainTestWrapper, container);
        expect(mainTest).toBeInstanceOf(MainTest);
        expect(mainTest.singProvider).toBeInstanceOf(SingProvider);
        expect(mainTest.prop).toBeInstanceOf(SingProvider);
        expect(mainTest.singProvider).toStrictEqual(mainTest.prop);
      });

      // transient
      test("should return different instances of component when load twice", async () => {
        const provider1 = await injector.loadProvider(transProviderWrapper, container);
        const provider2 = await injector.loadProvider(transProviderWrapper, container);
        expect(provider1).not.toBeNull();
        expect(provider2).not.toBeNull();
        expect(provider1).not.toBe(provider2);
      });

      test("should inject different instance into one hostInstance, when scope is SCOPE.TRANSIENT", async () => {
        @Component()
        class TransDepsMain {
          constructor(public transProvider1: TransProvider, public transProvider2: TransProvider) {}
        }

        const transDepsMainWrapper = new ComponentWrapper<TransDepsMain>({
          name: "TransDepsMain",
          type: TransDepsMain,
          instance: Object.create(TransDepsMain.prototype),
          isResolved: false,
        });
        container.addWrapper(transDepsMainWrapper);

        const main = await injector.loadProvider(transDepsMainWrapper, container);
        expect(main).toBeInstanceOf(TransDepsMain);
        expect(main.transProvider1).not.toBeNull();
        expect(main.transProvider2).not.toBeNull();
        expect(main.transProvider1).not.toBe(main.transProvider2);
      });
    });

    describe("load factory provider", () => {
      test("should return the value created by factory", async () => {
        const container = instanceTestContainer();

        class Provider1 {}

        let createInstance = undefined;
        const wrapper = container.addCustomFactory({
          name: "customFactory",
          type: Provider1,
          useFactory: () => {
            createInstance = new Provider1();
            return createInstance;
          },
          inject: [],
        });
        const instance1 = await injector.loadProvider(wrapper, container);
        const instance2 = await injector.loadProvider(wrapper, container);

        expect(instance1).toBeInstanceOf(Provider1);
        expect(instance1 === createInstance).toBeTruthy();
        expect(instance1 === instance2).toBeTruthy();
      });

      test("should return different instance, when cope=TRANSIENT", async () => {
        const container = instanceTestContainer();

        class Provider1 {}

        const wrapper = container.addCustomFactory({
          name: "customFactory",
          type: Provider1,
          scope: Scope.TRANSIENT,
          useFactory: () => {
            return new Provider1();
          },
          inject: [],
        });
        const instance1 = await injector.loadProvider(wrapper, container);
        const instance2 = await injector.loadProvider(wrapper, container);
        expect(instance1).not.toBeNull();
        expect(instance1).not.toBe(instance2);
      });

      test("should return the value created by factory, with custom inject param.", async () => {
        const container = instanceTestContainer();

        class Provider1 {
          constructor(public msg: string) {}
        }

        let createInstance = undefined;
        container.addCustomValue({
          name: "initMsg",
          type: String,
          useValue: "hello",
        });
        const wrapper = container.addCustomFactory({
          name: "customFactory",
          type: Provider1,
          useFactory: (initMsg: string) => {
            createInstance = new Provider1(initMsg);
            return createInstance;
          },
          inject: ["initMsg"],
        }) as ComponentWrapper<Provider1>;
        const instance = await injector.loadProvider(wrapper, container);

        expect(instance).toBeInstanceOf(Provider1);
        expect(instance === createInstance).toBeTruthy();
        expect(instance.msg).toBe("hello");
      });

      test("should return the value created by factory, with optional param.", async () => {
        const container = instanceTestContainer();

        class Provider1 {
          constructor(public msg: string) {}
        }

        let createInstance = undefined;
        const wrapper = container.addCustomFactory({
          name: "customFactory",
          type: Provider1,
          useFactory: (initMsg: string | undefined) => {
            createInstance = new Provider1(initMsg || "defaultValue");
            return createInstance;
          },
          inject: [{ name: "initMsg", isOptional: true }],
        }) as ComponentWrapper<Provider1>;
        const instance = await injector.loadProvider(wrapper, container);

        expect(instance).toBeInstanceOf(Provider1);
        expect(instance === createInstance).toBeTruthy();
        expect(instance.msg).toBe("defaultValue");
      });
    });
  });

  describe("name", () => {
    test("name's type is a symbol", async () => {
      const symbolName = Symbol("myProvider");

      @Component({ name: symbolName })
      class MyProvider {}

      const container = instanceTestContainer();
      const [myWrapper] = registerComponents(container, MyProvider);
      const wrapperA = container.getProvider(symbolName);
      const wrapperB = container.getProvider(MyProvider);

      expect(wrapperA).not.toBeNull();
      expect(wrapperA).toBe(wrapperB);
    });

    test("name's type is an array", async () => {
      @Component({ name: "a", alias: ["b"] })
      class MyProvider {}

      const container = instanceTestContainer();
      const [myWrapper] = registerComponents(container, MyProvider);
      const wrapperA = container.getProvider("a");
      const wrapperB = container.getProvider("b");
      expect(wrapperA).not.toBeNull();
      expect(wrapperA).toBe(wrapperB);
    });
  });

  describe("inject", () => {
    test("should inject undefined if the constructor param's type is not found and param is optional.", async () => {
      @Component()
      class Hello {}

      @Component()
      class HelloOptional {}

      @Component()
      class Main {
        @Optional()
        @Autowire()
        public hello: Hello;

        @Optional()
        @Autowire()
        public helloOptional: HelloOptional;
      }

      const container = instanceTestContainer();
      const [mainWrapper, helloWrapper] = registerComponents(container, Main, Hello);

      const instance = await injector.loadProvider<Main>(mainWrapper, container);
      expect(instance.hello).toBeInstanceOf(Hello);
      expect(instance.helloOptional).toBeUndefined();
    });

    test("should inject undefined if the property's type is not found and property is optional.", async () => {
      @Component()
      class Hello {}

      @Component()
      class HelloOptional {}

      @Component()
      class Main {
        constructor(@Optional() @Autowire() public hello: Hello, @Optional() @Autowire() public helloOptional: HelloOptional) {}
      }

      const container = instanceTestContainer();
      const [mainWrapper, helloWrapper] = registerComponents(container, Main, Hello);

      const instance = await injector.loadProvider<Main>(mainWrapper, container);
      expect(instance.hello).toBeInstanceOf(Hello);
      expect(instance.helloOptional).toBeUndefined();
    });
  });

  describe("with sub class", () => {
    test("should return child instance when get by super class", async () => {
      @Component()
      class SuperClazz {}

      @Component()
      class Sub1 extends SuperClazz {}

      const container = instanceTestContainer();
      const [subWrapper] = registerComponents(container, Sub1);

      const wrapper = container.getProvider(SuperClazz);
      expect(wrapper?.type).toBe(Sub1);
      const instance = await injector.loadProvider<SuperClazz>(wrapper!, container);
      expect(instance).toBeInstanceOf(Sub1);
    });

    test("should rise an error, when super class more than one sub providers.", async () => {
      @Component()
      class SuperClazz {}

      @Component()
      class Sub1 extends SuperClazz {}

      @Component()
      class Sub2 extends SuperClazz {}

      const container = instanceTestContainer();
      const [sub1Wrapper, sub2Wrapper] = registerComponents(container, Sub1, Sub2);

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
      @Component()
      class Dep {}

      @Component()
      class Main {
        constructor(@Autowire("dep") public dep: Dep) {}
      }

      @Component()
      class WrongMain {
        constructor(@Autowire("thisIsWrong") public dep: Dep) {}
      }

      const container = instanceTestContainer();

      const [mainWrapper, depWrapper, wrongMainWrapper] = registerComponents(container, Main, Dep, WrongMain);

      const instance = await injector.loadProvider<Main>(mainWrapper, container);
      expect(instance).toBeTruthy();
      expect(instance.dep).toBeInstanceOf(Dep);

      let error;
      let wrongInstance: WrongMain | undefined = undefined;
      try {
        wrongInstance = await injector.loadProvider<Main>(wrongMainWrapper, container);
      } catch (e) {
        console.warn(e);
        error = e;
      }
      expect(wrongInstance).toBeUndefined();
      expect(error).toBeTruthy();
      expect(error).toBeInstanceOf(UnknownDependenciesException);
    });

    it("should throw an error, if provider name is wrong.", async () => {
      @Component()
      class Dep {}

      @Component()
      class Main {
        constructor(@Autowire("thisIsWrong") public dep: Dep) {}
      }

      const container = instanceTestContainer();

      const [mainWrapper, depWrapper] = registerComponents(container, Main, Dep);

      let error;
      let wrongInstance: Main | undefined = undefined;
      try {
        wrongInstance = await injector.loadProvider<Main>(mainWrapper, container);
      } catch (e) {
        console.error(e);
        error = e;
      }
      expect(wrongInstance).toBeUndefined();
      expect(error).toBeTruthy();
      expect(error).toBeInstanceOf(UnknownDependenciesException);
    });

    it("should inject by provider type", async () => {
      @Component()
      class Dep {}

      @Component()
      class SubDep extends Dep {}

      @Component()
      class Main {
        constructor(@Autowire(Dep) public constructorDep: Dep, @Autowire(SubDep) public constructorSubDep: Dep) {}

        @Autowire(Dep)
        public propDep: Dep;

        @Autowire(SubDep)
        public propSubDep: Dep;
      }

      const container = instanceTestContainer();
      const [mainWrapper, depWrapper, subDepWrapper] = registerComponents(container, Main, Dep, SubDep);

      const instance = await injector.loadProvider<Main>(mainWrapper, container);
      expect(instance).toBeTruthy();
      expect(instance.constructorDep).toBeInstanceOf(Dep);
      expect(instance.constructorSubDep).toBeInstanceOf(SubDep);
      expect(instance.propDep).toBeInstanceOf(Dep);
      expect(instance.propSubDep).toBeInstanceOf(SubDep);
    });

    it("should not set a obscure type to constructor argument type.", async () => {
      @Component()
      class Dep {
        save() {
          // no-op
        }
      }

      @Component()
      class Main {
        constructor(@Autowire(Object) public constructorDep2: Dep) {}
      }

      const container = instanceTestContainer();
      const [mainWrapper, depWrapper] = registerComponents(container, Main, Dep);

      try {
        const instance = await injector.loadProvider<Main>(mainWrapper, container);
        throw new Error();
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDependencyTypeException);
      }
    });

    it("should throw an error, when the inject type not compatible with design type.", async () => {
      @Component()
      class Dep1 {
        save() {
          // no-op
        }
      }

      @Component()
      class Dep2 {
        save() {
          // no-op
        }
      }

      @Component()
      class Main {
        constructor(@Autowire(Dep1) public constructorDep2: Dep2) {}
      }

      const container = instanceTestContainer();
      const [mainWrapper, dep1Wrapper, dep2Wrapper] = registerComponents(container, Main, Dep1, Dep2);

      try {
        const instance = await injector.loadProvider<Main>(mainWrapper, container);
        throw new Error();
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDependencyTypeException);
      }
    });

    it("should not inject superclass into subclass", async () => {
      @Component()
      class BaseDep {
        save() {
          // no-op
        }
      }

      @Component()
      class Dep extends BaseDep {
        save() {
          // no-op
        }
      }

      @Component()
      class Main {
        constructor(@Autowire(BaseDep) public constructorDep2: Dep) {}
      }

      const container = instanceTestContainer();
      const [mainWrapper, baseDepWrapper, depWrapper] = registerComponents(container, Main, BaseDep, Dep);

      try {
        const instance = await injector.loadProvider<Main>(mainWrapper, container);
        throw new Error();
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDependencyTypeException);
      }
    });

    it("should inject by type and then by name", async () => {
      @Component()
      class Dep {}

      @Component()
      class SubDep1 extends Dep {}

      @Component()
      class SubDep2 extends Dep {}

      @Component()
      class Main {
        @Autowire()
        public subDep2: Dep;
      }

      const container = instanceTestContainer();
      const [mainWrapper, dep1Wrapper, dep2Wrapper] = registerComponents(container, Main, SubDep1, SubDep2);
      const instance = await injector.loadProvider<Main>(mainWrapper, container);
      expect(instance).toBeTruthy();
      expect(instance.subDep2).toBeInstanceOf(SubDep2);
    });
  });

  describe("loadInstance-sync", () => {
    afterAll(async () => {
      // no-op
    });

    it("should get a plain object, when all dependencies is sync", async () => {
      const wrapper = new ComponentWrapper();

      @Component()
      class Dep1 {}

      @Component()
      class Dep2 {}

      @Component({ scope: Scope.DEFAULT })
      class Main {
        constructor(public dep1: Dep1) {}

        @Autowire()
        public dep2: Dep2;
      }

      const container = instanceTestContainer();

      class TestModule {}

      const [dep1Wrapper, dep2Wrapper, mainWrapper] = registerComponents(container, Dep1, Dep2, Main);

      const instance = injector.loadInstance(mainWrapper, container).getResult() as Main;

      expect(instance).toBeInstanceOf(Main);
      expect(instance.dep1).toBeInstanceOf(Dep1);
      expect(instance.dep2).toBeInstanceOf(Dep2);
    });

    it("should get a promise, when it is a async factory function", async () => {
      @Component()
      class Dep1 {}

      const container = instanceTestContainer();
      const dep1ProviderWrapper = new ComponentWrapper({
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

      const instance = injector.loadInstance(dep1ProviderWrapper, container).getResult() as Promise<Dep1>;

      expect(instance).toBeInstanceOf(Promise);
      expect(await instance).toBeInstanceOf(Dep1);
    });

    it("should get a promise, when has a async dependency", async () => {
      @Component()
      class Dep1 {}

      @Component()
      class Main {
        constructor(@Autowire() public dep1: Dep1) {}
      }

      const container = instanceTestContainer();
      const [mainWrapper] = registerComponents(container, Main);
      const dep1ProviderWrapper = new ComponentWrapper({
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

      const loadResult = injector.loadInstance(mainWrapper, container).getResult() as Promise<Main>;

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
      @Component()
      class Dep1 {}

      @Component()
      class Dep2 {}

      @Component({ scope: Scope.TRANSIENT })
      class Main {
        constructor(public dep1: Dep1, public dep2: Dep2) {}
      }

      const container = instanceTestContainer();

      const [dep1Wrapper, dep2Wrapper, mainWrapper] = registerComponents(container, Dep1, Dep2, Main);

      const loadCtorMetadata = sinonBox.spy(injector, "loadCtorMetadata");

      const instance = (await injector.loadProvider(mainWrapper, container)) as Main;
      expect(instance).toBeTruthy();
      expect(loadCtorMetadata.notCalled).toBeTruthy();
      const instance1 = (await injector.loadProvider(mainWrapper, container)) as Main;
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
      @Component()
      class Dep1 {}

      @Component()
      class Dep2 {}

      @Component({ scope: Scope.TRANSIENT })
      class Main {
        @Autowire()
        public dep1: Dep1;

        @Autowire()
        public dep2: Dep2;
      }

      const container = instanceTestContainer();

      const [dep1Wrapper, dep2Wrapper, mainWrapper] = registerComponents(container, Dep1, Dep2, Main);

      const loadCtorMetadata = sinonBox.spy(injector, "loadPropertiesMetadata");

      const instance = (await injector.loadProvider(mainWrapper, container)) as Main;
      expect(instance).toBeTruthy();
      expect(loadCtorMetadata.notCalled).toBeTruthy();
      expect(instance.dep1).toBeInstanceOf(Dep1);
      expect(instance.dep2).toBeInstanceOf(Dep2);

      const instance1 = (await injector.loadProvider(mainWrapper, container)) as Main;
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
      @Component()
      class Dep {}

      @Component()
      class Main {
        @Autowire()
        public dep: Dep;
      }

      const container = instanceTestContainer();

      const [mainWrapper, depWrapper] = registerComponents(container, Main, Dep);

      const addProvider = sinonBox.spy(container, "addProvider");

      const instance = (await injector.loadProvider(mainWrapper, container)) as Main;
      expect(instance).toBeTruthy();
      expect(addProvider.notCalled).toBeTruthy();
      expect(instance.dep).toBeInstanceOf(Dep);
    });

    it("should dynamic loading the model instance, at run time", async () => {
      @Component({ lazyRegister: true })
      class Dep {}

      @Component()
      class Main {
        @Autowire()
        public dep: Dep;
      }

      const container = instanceTestContainer();

      const [mainWrapper] = registerComponents(container, Main);

      const addProvider = sinonBox.spy(container, "addProvider");

      const instance = (await injector.loadProvider(mainWrapper, container)) as Main;
      expect(instance).toBeTruthy();
      expect(addProvider.calledOnce).toBeTruthy();
      expect(instance.dep).toBeInstanceOf(Dep);

      // try again
      const instance1 = (await injector.loadProvider(mainWrapper, container)) as Main;
      expect(instance1).toBeTruthy();
      expect(addProvider.calledOnce).toBeTruthy();
      expect(instance1.dep).toBeInstanceOf(Dep);
    });
  });

  describe("replaceProvider", () => {
    it("should replace a class provider", async () => {
      @Component()
      class Dep {
        getMessage() {
          return "message";
        }
      }

      @Component()
      class Dep1 {
        getMessage() {
          return "message1";
        }
      }

      const container = instanceTestContainer();

      registerComponents(container, Dep);

      const depWrapper = container.getProvider(Dep)!;

      const instance = (await injector.loadProvider(depWrapper, container)) as Dep;
      expect(instance.getMessage()).toBe("message");
      container.replace(depWrapper?.id, { type: Dep1, useClass: Dep1 });
      const dep1Wrapper = container.getProvider(Dep)!;

      const instance1 = (await injector.loadProvider(dep1Wrapper, container)) as Dep;
      expect(instance1.getMessage()).toBe("message1");
    });
  });

  describe("life cycle", () => {
    it("should call life cycle methods.", async () => {
      @Component()
      class MyProvider implements IComponentLifecycle {
        // public afterPropertiesSetMsg: string;
        public initializeMsg: string;

        // afterPropertiesSet(): Promise<void> | void {
        //   this.afterPropertiesSetMsg = "hello afterPropertiesSet";
        // }

        initialize(): Promise<void> | void {
          this.initializeMsg = "hello initialize";
        }
      }

      const container = instanceTestContainer();
      registerComponents(container, MyProvider);
      const myWrapper = container.getProvider(MyProvider)!;
      const instance = (await injector.loadProvider(myWrapper, container)) as MyProvider;
      // expect(instance.afterPropertiesSetMsg).toBe("hello afterPropertiesSet");
      expect(instance.initializeMsg).toBe("hello initialize");
    });

    it("should call life cycle async methods.", async () => {
      @Component()
      class MyProvider implements IComponentLifecycle {
        // public afterPropertiesSetMsg: string;
        public initializeMsg: string;

        // async afterPropertiesSet(): Promise<void> {
        //   await new Promise<void>((resolve) => {
        //     setTimeout(() => {
        //       this.afterPropertiesSetMsg = "hello afterPropertiesSet";
        //       resolve();
        //     }, 5);
        //   });
        // }

        async initialize(): Promise<void> {
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              this.initializeMsg = "hello initialize";
              resolve();
            }, 5);
          });
        }
      }

      const container = instanceTestContainer();
      registerComponents(container, MyProvider);
      const myWrapper = container.getProvider(MyProvider)!;
      const instance = (await injector.loadProvider(myWrapper, container)) as MyProvider;
      // expect(instance.afterPropertiesSetMsg).toBe("hello afterPropertiesSet");
      expect(instance.initializeMsg).toBe("hello initialize");
    });

    it("should call life cycle methods, when registered as a factory provider.", async () => {
      @Component()
      class MyProvider implements IComponentLifecycle {
        // public afterPropertiesSetMsg = "hello";
        public initializeMsg = "hello";

        // afterPropertiesSet(): Promise<void> | void {
        //   this.afterPropertiesSetMsg = "hello afterPropertiesSet";
        // }

        initialize(): Promise<void> | void {
          this.initializeMsg = "hello initialize";
        }
      }

      const container = instanceTestContainer();
      container.addCustomFactory({
        name: "MyProvider",
        type: MyProvider,
        useFactory: () => {
          return new MyProvider();
        },
      });
      const myWrapper = container.getProvider(MyProvider)!;
      const instance = (await injector.loadProvider(myWrapper, container)) as MyProvider;
      // expect(instance.afterPropertiesSetMsg).toBe("hello");
      expect(instance.initializeMsg).toBe("hello initialize");
    });
  });

  describe("component with package", () => {
    test("Should GLOBAL access control work well.", async () => {
      const helloPackage = createPackage("helloPackage");

      @helloPackage.Package()
      @Component({ global: true })
      class PublicComp {}

      @Component()
      class GlobalComp {
        constructor(@Autowire("publicComp") public publicComp: PublicComp) {}
      }

      const container = instanceTestContainer();
      registerComponents(container, PublicComp, GlobalComp);
      const publicWrapper = container.getProviderByName("publicComp");
      expect(publicWrapper?.useClass).toBe(PublicComp);

      const globalWrapper = container.getProvider(GlobalComp)!;
      const globalComp = await injector.loadProvider(globalWrapper, container);
      expect(globalComp.publicComp).toBeInstanceOf(PublicComp);
    });

    test("Should NOT GLOBAL access control work well.", async () => {
      const helloPackage = createPackage("HelloPackage");

      @helloPackage.Package()
      @Component({ global: false })
      class PrivateComp {}

      @Component()
      class GlobalComp {
        constructor(@Autowire("privateComp") public dep: PrivateComp) {}
      }

      const container = instanceTestContainer();
      registerComponents(container, PrivateComp, GlobalComp);
      let privateWrapper = container.getProviderByName("privateComp");
      expect(privateWrapper).toBeFalsy();
      privateWrapper = container.getProviderByName("privateComp", "HelloPackage"); // specify package,
      expect(privateWrapper).toBeTruthy();
      expect(privateWrapper?.useClass).toBe(PrivateComp);

      const globalWrapper = container.getProvider(GlobalComp)!;
      let loadErr = null;
      try {
        await injector.loadProvider(globalWrapper, container);
      } catch (err) {
        loadErr = err;
      }
      expect(loadErr?.message).toContain("privateComp");

      // expect(globalComp.dep).toBeInstanceOf(PrivateComp)
    });

    test("Should load component in same package priority.", async () => {
      const helloPackage = createPackage("HelloPackage");

      @helloPackage.Package()
      @Component({ name: "comp1" })
      class Comp1 {}

      @helloPackage.Package()
      @Component({ name: "comp2" })
      class Comp2 {
        constructor(@Autowire("comp1") public dep: Object) {}
      }

      @Component({ name: "comp1" })
      class Comp3 {}

      const container = instanceTestContainer();
      registerComponents(container, Comp1, Comp2, Comp3);
      const wrapper2 = container.getProvider(Comp2)!;
      const comp2 = await injector.loadProvider(wrapper2, container);
      expect(comp2.dep).toBeInstanceOf(Comp1);
    });
  });

  test("Should load component in global public domain, when host is global.", async () => {
    const helloPackage = createPackage("HelloPackage");

    @helloPackage.Package()
    @Component({ name: "comp1" })
    class Comp1 {}

    @Component({ name: "comp2" })
    class Comp2 {
      constructor(@Autowire("comp1") public dep: Object) {}
    }

    @Component({ name: "comp1" })
    class Comp3 {}

    const container = instanceTestContainer();
    registerComponents(container, Comp1, Comp2, Comp3);
    const wrapper2 = container.getProvider(Comp2)!;
    const comp2 = await injector.loadProvider(wrapper2, container);
    expect(comp2.dep).toBeInstanceOf(Comp3);
  });
});
