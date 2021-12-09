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

  @Get("/detail/**")
  public async getDoc(@Param("*") path) {
    return {
      data: await this.docsService.getDoc("/" + path),
      treeData: await this.docsService.getTitleTree("/" + path),
    };
  }
}
