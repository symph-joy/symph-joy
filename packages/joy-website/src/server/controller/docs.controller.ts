import { Controller, Get, Param, Query } from "@symph/server";
import { Doc, DocsService } from "../service/docs.service";

@Controller("/docs")
export class DocsController {
  constructor(private docsService: DocsService) {}

  @Get("menus")
  public async getMenus() {
    return {
      data: await this.docsService.getMenus(),
    };
  }

  @Get("/detail")
  public async getDoc(@Query("path") path: any) {
    console.log(path);
    return {
      data: await this.docsService.getDoc(path),
    };
  }
}
