import { Component, IComponentLifecycle } from "@symph/core";
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

  public async getAllDocs() {
    this.getMenus();
    const res = [];
    for (const menu of this.menus) {
      for (const child of menu.children) {
        const doc = await this.getTree(child.path, 2, 0);
        const obj = {
          ...doc[0],
          path: child.path,
          file: child.file,
        };
        res.push(obj);
        const doc2 = await this.getTree(child.path, 3, 2);
        const obj1 = {
          path: child.path,
          file: child.file,
          text: child.title,
          depth: 1,
          children: doc2,
        };
        res.push(obj1);
      }
    }
    this.titleArray = res;
  }

  public getTitleArray() {
    return this.titleArray;
  }

  public async getMenus(): Promise<DocMenu[]> {
    const { dir } = {
      dir: "./docs",
    };
    if (!dir) {
      console.warn("Warning: Doc dir is not config.");
      return [];
    }
    const dirs = typeof dir === "string" ? [dir] : dir;
    this.menus = this.scanDir(dirs);
    return this.fmtMenus(this.menus);
  }

  public async getDoc(docPath: string): Promise<Doc> {
    const doc = this.menusCache.get(docPath);
    if (!doc) {
      throw new NotFoundException(docPath, `Doc was not found, path: ${docPath}`);
    }
    if (doc.htmlContent === undefined) {
      if (!doc.file) {
        throw new Error(`Doc file is not defined. doc Path: ${docPath}`);
      }
      const mdContent = fs.readFileSync(doc.file, { encoding: "utf-8" });
      doc.htmlContent = this.markdownToHtml(mdContent);
    }
    return doc;
  }

  public async getTree(docPath: string, max: number, min: number): Promise<TreeItem[] | []> {
    const doc = this.getDoc(docPath);
    const mdContent = fs.readFileSync((await doc).file, { encoding: "utf-8" });
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

  public scanDir(dirs: string[]): Doc[] {
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

      const doc = this.recursiveFindDoc(dir, "", dir);

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

  private recursiveFindDoc(dir: string, parentPath: string, rootDir): Doc {
    const baseName = path.basename(dir);
    const menuItemConfig = this.tryGetMenuConfig(dir);
    const nodePath = menuItemConfig?.path || baseName;
    const menuPath = parentPath + "/" + nodePath;
    const menuTitle = menuItemConfig?.title || nodePath;

    let children: Doc[] | undefined;
    if (menuItemConfig?.children) {
      children = menuItemConfig.children;
    } else {
      children = [];
      const childPaths = fs.readdirSync(dir);
      childPaths.forEach((filePath: string) => {
        if (filePath.startsWith(".") || filePath.startsWith("_")) {
          return;
        }
        const absolutePath = join(dir, filePath);
        const pathStat = fs.statSync(absolutePath);
        if (pathStat.isDirectory()) {
          const child = this.recursiveFindDoc(absolutePath, menuPath, rootDir);
          if (child) {
            children.push(child);
          }
        } else {
          if (!/\.md$/i.test(absolutePath)) {
            return;
          }
          let baseName = path.basename(absolutePath);
          const childNodePath = baseName.slice(0, baseName.indexOf("."));
          const childPath = `${parentPath}/${childNodePath}`;
          const childTitle = childNodePath;
          children.push({
            title: childTitle,
            path: childPath,
            file: absolutePath,
          } as Doc);
        }
      });
    }

    return {
      title: menuTitle,
      path: menuPath,
      file: dir,
      children,
    } as Doc;
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
