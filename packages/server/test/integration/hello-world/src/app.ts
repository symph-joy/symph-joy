import { ServerFactory } from "../../../../dist";
import { HelloController } from "./hello.controller";
import { HelloService } from "./hello.service";

async function runApp() {
  const app = await ServerFactory.create([HelloController, HelloService]);
  await app.listen(3000);
}

runApp();
