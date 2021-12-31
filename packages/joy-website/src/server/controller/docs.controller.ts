import { Controller, Get, Param, Query } from "@symph/server";
import { DocsService } from "../service/docs.service";

@Controller("/docs")
export class DocsController {
  constructor(private docsService: DocsService) {}

  @Get("menus")
  public async getMenus(@Query("path") path: any) {
    return {
      data: await this.docsService.getMenus(path),
    };
  }
  @Get("allMenus")
  public async getAllMenus() {
    return {
      data: await this.docsService.getAllMenus(),
    };
  }

  @Get("/detail/**")
  public async getDoc(@Param("*") path) {
    return {
      data: await this.docsService.getDoc("/" + path),
      treeData: await this.docsService.getTitleTree("/" + path),
    };
  }

  @Get("/titleArray")
  public async getTitleArray() {
    return {
      data: await this.docsService.getTitleArray(),
    };
  }
}
