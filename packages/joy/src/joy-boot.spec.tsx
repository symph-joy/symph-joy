import { Component, Configuration } from "@symph/core";
import { JoyBoot } from "./joy-boot";
import { Command } from "./command/command.decorator";

describe("joy", () => {
  test("JoyBoot is a container", async () => {
    @Component()
    class HelloProvider {
      @Command()
      sayHello({ message }: any) {
        return `hello ${message}`;
      }
    }

    const joyBoot = new JoyBoot();
    joyBoot.registerCommand(new HelloProvider());
    expect(await joyBoot.runCommand("sayHello", { message: "joy" })).toBe("hello joy");
  });
});
