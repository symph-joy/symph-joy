describe("cli", () => {
  test("run joy --version", async () => {
    console.dir("process.argv", process.argv);
    const args = ["_", "_", "dev"];
    // const child = fork(require.resolve('./cli'), args, { execArgv: args });

    process.argv = args;

    require("./cli");
  });
});
