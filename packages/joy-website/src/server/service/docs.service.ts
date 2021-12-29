import { Component, IComponentLifecycle, RuntimeException } from "@symph/core";
import * as fs from "fs";
import * as path from "path";
import { join, sep } from "path";
import { Value } from "@symph/config";
import { NotFoundException } from "@symph/server/dist/exceptions-common";
import { marked } from "marked";

export interface DocMenu {
  title: string;
  path: string;
  children?: DocMenu[];
}

export class Doc {
  title: string;
  path: string;
  file: string;
  htmlContent?: string;
  children?: Doc[];
  hasMenu?: boolean;
}

export class DocJoyConfig {
  dir: string | string[];
}

export interface TreeItem {
  children?: TreeItem[];
  type?: string;
  raw?: string;
  depth?: number;
  text?: string;
  tokens?: [];
  id?: string;
  path?: string;
  file?: string;
}

@Component()
export class DocsService implements IComponentLifecycle {
  @Value({ configKey: "docs" })
  public configDocs: DocJoyConfig;

  public menus: Doc[];

  public menusCache: Map<string, Doc> = new Map<string, Doc>();

  public titleArray: TreeItem[];

  async initialize() {
    await this.getAllDocs();
  }

  // 获取所有能搜索到的树结构
  public async getAllDocs() {
    // await this.getMenus();
    // const res = [];
    // for (const menu of this.menus) {
    //   await this.getOneSeachTree(menu, res);
    // }
    // this.titleArray = res;
  }

  public async getOneSeachTree(menu, res) {
    if (menu.children) {
      for (const child of menu.children) {
        await this.getOneSeachTree(child, res);
      }
    } else {
      const doc = await this.getTree(menu.path, 2, 0);
      const obj = {
        ...doc[0],
        path: menu.path,
        file: menu.file,
      };
      res.push(obj);
      const doc2 = await this.getTree(menu.path, 3, 2);
      const obj1 = {
        path: menu.path,
        file: menu.file,
        text: doc[0].text,
        depth: 1,
        children: doc2,
      };
      res.push(obj1);
    }
  }

  public getTitleArray() {
    return this.titleArray;
  }

  public async getMenus(path: string): Promise<DocMenu[]> {
    let { dir } = this.configDocs || {};
    dir += path;
    return this.getMenusByDir(dir);
  }

  public async getAllMenus(): Promise<DocMenu[]> {
    const { dir } = this.configDocs || {};
    return this.getMenusByDir(dir);
  }

  public async getMenusByDir(dir): Promise<DocMenu[]> {
    if (!dir) {
      console.warn("Warning: Doc dir is not config.");
      return [];
    }

    const dirs = typeof dir === "string" ? [dir] : dir;
    this.menus = await this.scanDir(dirs);
    return this.fmtMenus(this.menus);
  }

  public async getDoc(docPath: string): Promise<Doc> {
    const doc = this.menusCache.get(docPath);
    if (!doc) {
      throw new NotFoundException(docPath, `Doc was not found, path: ${docPath}`);
    }
    return await this.getDocHtmlContent(doc, docPath);
  }

  async getDocHtmlContent(doc, docPath) {
    if (doc.htmlContent === undefined) {
      if (!doc.file) {
        throw new Error(`Doc file is not defined. doc Path: ${docPath}`);
      }
      const mdContent = fs.readFileSync(doc.file, { encoding: "utf-8" });
      doc.htmlContent = this.markdownToHtml(mdContent);
      if (!doc.hasMenu) {
        const title = await this.getDetailHtmlContentTree(mdContent, 1, 0);
        doc.title = title && title[0].text;
      }
    }
    return doc;
  }

  public async getDetailHtmlContentTree(mdContent, max: number, min: number) {
    const trees = marked.lexer(mdContent);
    const titleTree = [];
    for (const tree of trees) {
      if (tree.type === "heading" && tree.depth <= max && tree.depth > min) {
        let id = "#" + tree.text.replace(new RegExp(/( )/g), "-").toLowerCase();
        titleTree.push({
          ...tree,
          id,
        });
      }
    }
    if (titleTree.length !== 0) {
      const renderTree = { children: [] };
      const res = this.getMarkdownTree(0, renderTree, renderTree, titleTree);
      return res.children;
    } else {
      return [];
    }
  }

  public async getTree(docPath: string, max: number, min: number): Promise<TreeItem[] | []> {
    const doc = this.getDoc(docPath);
    const mdContent = fs.readFileSync((await doc).file, { encoding: "utf-8" });
    return this.getDetailHtmlContentTree(mdContent, max, min);
  }

  public async getTitleTree(docPath: string): Promise<TreeItem[] | []> {
    return await this.getTree(docPath, 3, 1);
  }

  public getParent = (index: number, res: TreeItem, markdown: TreeItem[]): TreeItem => {
    const i = index;
    if (markdown[i].depth - 1 === 1) {
      return res;
    } else {
      while (markdown[i].depth - 1 != markdown[index].depth) {
        index--;
      }
      return markdown[index];
    }
  };

  public getMarkdownTree = (index: number, ele: TreeItem, res: TreeItem, markdown: TreeItem[]): TreeItem => {
    ele.children = ele.children || [];
    if (index === markdown.length - 1) {
      ele.children.unshift(markdown[index]);
      return ele;
    }
    if (markdown[index].depth === markdown[index + 1].depth) {
      ele = this.getMarkdownTree(index + 1, ele, res, markdown);
      ele.children.unshift(markdown[index]);
    } else if (markdown[index].depth < markdown[index + 1].depth) {
      ele.children.unshift(this.getMarkdownTree(index + 1, markdown[index], res, markdown));
    } else {
      ele.children.unshift(markdown[index]);
      this.getMarkdownTree(index + 1, this.getParent(index + 1, res, markdown), res, markdown);
    }
    return ele;
  };

  private markdownToHtml(mdContent: string): string {
    marked.setOptions({
      highlight: function (code, lang) {
        const hljs = require("highlight.js");
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
      // pedantic: false,
      // gfm: true,
      // breaks: false,
      // sanitize: false,
      // smartLists: true,
      // smartypants: false,
      // xhtml: false
    });

    const htmlContent = marked.parse(mdContent);
    return htmlContent;
  }

  private fmtMenus(docs: Doc[]): DocMenu[] {
    const menus = [] as DocMenu[];
    for (const doc of docs) {
      const { file, children, ...menu } = doc;
      let menuChildren: DocMenu[] | undefined;
      if (children) {
        menuChildren = this.fmtMenus(children);
      }
      menus.push({
        ...menu,
        children: menuChildren,
      });
    }
    return menus;
  }

  public async scanDir(dirs: string[]): Promise<Doc[]> {
    const docs = [] as Doc[];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        console.warn(`Warning: Document root dir(${dir}) is not exists.`);
        return [];
      }
      const dirState = fs.statSync(dir);
      if (dirState.isFile()) {
        throw new Error(`Document root path(${dir}) is a file, expect is a directory.`);
      }

      const doc = await this.recursiveFindDoc(dir, "", dir);

      doc?.children && docs.push(...doc.children);
    }
    this.setCache(docs);
    return docs;
  }

  private setCache(docs: Doc[]): void {
    this.menusCache.clear();
    const findDoc = (children: Doc[]) => {
      for (const child of children) {
        const { file, children, path } = child;
        if (file) {
          this.menusCache.set(path, child);
        }
        if (children) {
          findDoc(children);
        }
      }
    };
    findDoc(docs);
  }

  getMenuJsonTitleName(children, path) {
    for (const child of children) {
      if (child.path === path) {
        return child.title;
      } else {
        if (Array.isArray(child.children)) {
          this.getMenuJsonTitleName(child.children, path);
        }
      }
    }
  }
  compareFile(first, second) {
    for (let i = 0; i < first.length; i++) {
      if (second[i] === undefined) {
        return true;
      }
      if (first[i] !== second[i]) {
        if (isNaN(first[i]) && !isNaN(second[i])) {
          return true;
        }
        if (!isNaN(first[i]) && isNaN(second[i])) {
          return false;
        }
        return first[i] > second[i];
      }
    }
  }
  // 按照数字、字母排序
  sortMenu(menus) {
    if (menus.children.length > 1) {
      let arr = menus.children;
      for (let i = arr.length - 1; i > 0; i--) {
        for (let j = 0; j < i; j++) {
          let first = arr[j].file.split("/");
          first = first[first.length - 1].split(".")[0].split("-");
          let second = arr[j + 1].file.split("/");
          second = second[second.length - 1].split(".")[0].split("-");
          if (this.compareFile(first, second)) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          }
        }
      }
    } else {
      return menus;
    }
  }

  private async recursiveFindDoc(dir: string, parentPath: string, rootDir): Promise<Doc> {
    const baseName = path.basename(dir);
    const menuItemConfig = this.tryGetMenuConfig(dir);
    const nodePath = menuItemConfig?.path || baseName;
    const menuPath = parentPath + "/" + nodePath;
    const menuTitle = menuItemConfig?.title || nodePath;
    let children: Doc[] | undefined;
    children = [];
    const childPaths = fs.readdirSync(dir);
    childPaths.forEach(async (filePath: string) => {
      if (filePath.startsWith(".") || filePath.startsWith("_")) {
        return;
      }
      const absolutePath = join(dir, filePath);
      const pathStat = fs.statSync(absolutePath);
      if (pathStat.isDirectory()) {
        const child = await this.recursiveFindDoc(absolutePath, menuPath, rootDir);
        // this.sortMenu(child);
        if (child) {
          children.push(child);
        }
      } else {
        if (!/\.md$/i.test(absolutePath)) {
          return;
        }
        let baseName = path.basename(absolutePath);
        const childNodePath = baseName.slice(0, baseName.indexOf("."));
        let childPath = `${parentPath}/${childNodePath}`;
        const childTitle = childNodePath;
        let title;
        // 不支持menu.json中嵌套多个children，只支持一级children
        if (menuItemConfig?.children) {
          title = this.getMenuJsonTitleName(menuItemConfig?.children, childPath);
        }
        // 去掉path前的数字
        childPath = this.deletePathNumber(childPath);
        let doc = {
          title: title || childTitle,
          path: childPath,
          file: absolutePath,
          hasMenu: title ? true : false,
        };
        doc = await this.getDocHtmlContent(doc, childPath);
        children.push(doc as Doc);
      }
    });
    return (await {
      title: menuTitle,
      path: menuPath,
      file: dir,
      children,
    }) as Doc;
  }

  deletePathNumber(path) {
    const array = path.split("/");
    const result = [];
    for (const arr of array) {
      const temArr = arr.split("-");
      let res = [];
      for (const tem of temArr) {
        if (isNaN(tem)) {
          res.push(tem);
        }
      }
      result.push(res.join("-"));
    }
    return result.join("/");
  }

  private tryGetMenuConfig(absDirPath: string): Doc | undefined {
    const configFilePath = path.join(absDirPath, "menu.json");
    if (!fs.existsSync(configFilePath)) {
      return undefined;
    }
    const data = fs.readFileSync(configFilePath, { encoding: "utf-8" });
    return JSON.parse(data);
  }

  // private getMenuPath(absPath: string): string {
  //   const relPath = absPath.replace(this.rootDir, "");
  //
  //   const pathSegments = relPath.split(sep).filter(Boolean);
  //   let lastSeg = pathSegments[pathSegments.length - 1];
  //   if (lastSeg) {
  //     const indexOfDot = lastSeg.indexOf('.')
  //     if (indexOfDot === 0) {
  //       throw new Error('File name should not start with "."')
  //     } else if (indexOfDot > 0) {
  //       lastSeg = lastSeg.substr(0, lastSeg.indexOf('.'))
  //       pathSegments[pathSegments.length - 1] = lastSeg
  //     }
  //   }
  //   return "/" + pathSegments.join('/')
  // }
  //
}
