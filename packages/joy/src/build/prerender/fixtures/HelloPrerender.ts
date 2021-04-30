import { ReactController } from "@symph/react";
import { JoyPrerenderInterface } from "../prerender.interface";

class HelloPrerender implements JoyPrerenderInterface {
  getRoute(): string | ReactController {
    return "hello/:message";
  }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string | { params: { message: string } }>> {
    return [{ params: { message: "joy" } }, { params: { message: "lane" } }];
  }
}
