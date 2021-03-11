const yargs = require("yargs");

const argv = yargs
  .command("get", "make a get HTTP request", function (yargs) {
    return yargs.options({
      url: {
        alias: "u",
        description: "aaa",
        default: "http://yargs.js.org/",
      },
      port: { type: "number" },
      size: { choices: ["xs", "s", "m", "l", "xl"] },
    });
  })
  .help();
argv.showHelp("log");

console.log(argv.argv);
