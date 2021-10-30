import { createPackage, getPackageMeta } from "./package";
import { Component, getComponentMeta } from "../decorators";

describe("package", () => {
  test(`Should get the package name of the component.`, () => {
    const APackage = createPackage("helloPkg");

    @APackage.Package()
    @Component({ name: "comp", global: true })
    class Comp1 {}

    const packageName = getPackageMeta(Comp1);
    expect(packageName).toMatchObject({
      name: "helloPkg",
    });
    const componentMeta = getComponentMeta(Comp1);
    expect(componentMeta).toMatchObject({
      global: true,
      name: "comp",
    });
  });
});
