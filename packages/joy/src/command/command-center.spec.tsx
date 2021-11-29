import { ApplicationContext, ApplicationContainer } from "@symph/core";
import yargs from "yargs";
import { CommandProvider } from "./command-provider.decorator";
import { CommandCenter } from "./command-center";
import { JoyCommand, JoyCommandOptionType } from "./command";

describe("command-center", () => {
  test("register command manual", async () => {
    @CommandProvider()
    class HelloCommand extends JoyCommand {
      getName(): string {
        return "hello";
      }

      options() {
        return {
          message: { type: "string" as const, default: "joy" },
        };
      }

      run(args: JoyCommandOptionType<this>): any {
        const { message } = args;
        return `hello ${message}`;
      }
    }
    const commandCenter1 = new CommandCenter();
    commandCenter1.registerCommand(new HelloCommand());
    expect(await commandCenter1.runCommand("hello", { message: "joy" })).toBe("hello joy");
  });

  test("register command", async () => {
    @CommandProvider()
    class HelloCommand extends JoyCommand {
      getName(): string {
        return "hello";
      }

      options() {
        return {
          message: { type: "string" as const, default: "joy" },
        };
      }

      run(args: JoyCommandOptionType<this>): any {
        const { message } = args;
        return `hello ${message}`;
      }
    }
    const app = new ApplicationContext({ CommandCenter, HelloCommand });
    await app.init();
    const commandCenter = await app.get(CommandCenter);
    // const helloCommand = await app.get(HelloCommand)
    expect(await commandCenter.runCommand("hello", { message: "joy" })).toBe("hello joy");
  });

  test("parse args", async () => {
    process.argv = ["aa", "get", "--help"];
    const argv = yargs
      .command("get", "make a get HTTP request", function (yargs) {
        return yargs
          .option("url", {
            alias: "u",
            description: "aaa",
            default: "http://yargs.js.org/",
          })
          .help("a", "aaaaa");
      })
      .help();
    argv.showHelp("log");
    // console.log(argv)
  });

  test("extend command", async () => {
    class HelloCommand extends JoyCommand {
      getName(): string {
        return "";
      }

      options() {
        return {
          message: { type: "string" as const, default: "joy" },
        };
      }

      run(args: JoyCommandOptionType<this>): any {
        return `hello ${args.message}`;
      }
    }
  });
});
