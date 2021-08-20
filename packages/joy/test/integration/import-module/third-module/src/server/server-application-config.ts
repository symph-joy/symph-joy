import { Configuration } from "@symph/core";
import { HelloController } from "./controller/hello.controller";

@Configuration({ imports: { HelloController } })
export class ServerApplicationConfig {}
