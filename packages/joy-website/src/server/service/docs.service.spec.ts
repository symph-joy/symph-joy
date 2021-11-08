import { DocsService } from "./docs.service";
import * as path from "path";

describe("doc.service", () => {
  test(`Generate menus from file system.`, async () => {
    const docService = new DocsService();
    docService.configDocs = {
      dir: path.resolve(__dirname, "../../../docs"),
    };
    const menus = await docService.getMenus();
    console.log(menus);
  });
});
