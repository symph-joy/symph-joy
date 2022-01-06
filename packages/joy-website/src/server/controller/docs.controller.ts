import { Controller, Get, Param, Query } from "@symph/server";
import { DocsService } from "../service/docs.service";

@Controller("/docs")
export class DocsController {
  constructor(private docsService: DocsService) {}

  @Get("menus")
  public getMenus(@Query("path") path: string) {
    return {
      data: this.docsService.getMenus(path),
    };
  }
  
  @Get("allMenus")
  public getAllMenus() {
    return {
      data: this.docsService.getAllMenus(),
    };
  }

  @Get("/detail/**")
  public getDoc(@Param("*") path: string) {
    return {
      data: this.docsService.getDoc("/" + path),
    };
  }

  @Get("/titleArray")
  public getTitleArray() {
    return {
      data: this.docsService.getTitleArray(),
    };
  }
}
