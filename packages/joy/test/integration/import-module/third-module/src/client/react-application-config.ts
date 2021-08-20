import { Configuration } from "@symph/core";
import HelloReactController from "./pages/index";

@Configuration({ imports: { HelloReactController } })
export class ReactApplicationConfig {}
