import { BaseReactModel, ReactModel } from "@symph/react";
import { FetchError, ReactFetchService } from "@symph/joy";
import { Inject } from "@symph/core";

export interface DocMenuItem {
  title: string;
  path: string;
  children: DocMenuItem[];
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

export type DocsModelState = {
  docMenus: DocMenuItem[];
  titleTrees: TreeItem[];
  result: TreeItem[];
  loadingCurrentDoc: boolean;
  loadCurrentDocErr?: { code: number; message: string };
  currentDoc: DocMenuItem & { htmlContent };
  openKeys: Array<string>;
  snippets: Record<string, DocMenuItem & { htmlContent }>;
  defaultOpenKeys: Array<string>;
};

@ReactModel()
export class DocsModel extends BaseReactModel<DocsModelState> {
  constructor(@Inject("joyFetchService") private fetchService: ReactFetchService) {
    super();
  }

  getInitState(): DocsModelState {
    return {
      loadingCurrentDoc: false,
      docMenus: [],
      titleTrees: [],
      currentDoc: undefined,
      result: [],
      openKeys: [],
      snippets: {},
      defaultOpenKeys: [],
    };
  }

  titleArrays = [];

  handleString(string: string) {
    return string.toLowerCase().replace(/\s/g, "");
  }

  async getSearch(value: string) {
    const res = [];
    let titleArray: TreeItem[];
    if (this.titleArrays.length === 0) {
      const resp = await this.fetchService.fetchApi("/docs/titleArray");
      const respJson = await resp.json();
      titleArray = respJson.data;
      this.titleArrays = titleArray;
    } else {
      titleArray = this.titleArrays;
    }
    if (value) {
      for (const h1 of titleArray) {
        if (h1.text.includes(value) || this.handleString(h1.text).includes(this.handleString(value))) {
          const temp = res.find((value) => value.path === h1.path);
          if (!temp) {
            let obj = {
              text: h1.text,
              id: h1.id,
              path: h1.path,
              file: h1.file,
            };
            res.push(obj);
          }
        }
        if (h1.children) {
          for (const h2 of h1.children) {
            if (h2.text.includes(value) || this.handleString(h2.text).includes(this.handleString(value))) {
              let obj = {
                text: h1.text,
                id: h1.id,
                path: h1.path,
                file: h1.file,
                children: [
                  {
                    text: h2.text,
                    id: h2.id,
                  },
                ],
              };
              res.push(obj);
            }
          }
        }
      }
    }

    this.setState({
      result: res,
    });
  }

  async clearSearch() {
    this.setState({
      result: [],
    });
  }

  async getDocMenus(path: string): Promise<DocMenuItem[]> {
    const resp = await this.fetchService.fetchApi("/docs/menus?path=" + encodeURIComponent(path));
    const respJson = await resp.json();
    const openKeys = await this.getDefaultOpenKeys(respJson.data);
    this.setState({
      docMenus: respJson.data,
      openKeys,
    });
    return respJson.data;
  }

  initialSetOpenKeys() {
    this.setState({
      defaultOpenKeys: this.state.openKeys,
    });
  }

  changeOpenKeys(openKeys) {
    this.setState({
      defaultOpenKeys: openKeys,
    });
  }

  async getAllDocsMenus(): Promise<DocMenuItem[]> {
    const resp = await this.fetchService.fetchApi("/docs/allMenus");
    const respJson = await resp.json();
    // this.setState({
    //   docMenus: respJson.data,
    // });
    return respJson.data;
  }

  async flatDocMenus(arr, res) {
    if (Array.isArray(arr)) {
      for (const child of arr) {
        if (child.children) {
          res.push(child.path);
          this.flatDocMenus(child.children, res);
        }
      }
    }
  }

  async getDefaultOpenKeys(docMenus) {
    const res = [];
    await this.flatDocMenus(docMenus, res);
    return res;
  }

  async recurrencePreDocMenus(menu: DocMenuItem[], res: object[]) {
    for (const arr of menu) {
      if (arr.children) {
        if (arr.children.length > 0) {
          this.recurrencePreDocMenus(arr.children, res);
        }
      } else {
        res.push({
          doc: "/docs" + arr.path,
          detail: "/docs/detail" + arr.path,
        });
      }
    }
  }

  async getPreDocMenus() {
    const res = [];
    await this.recurrencePreDocMenus(this.state.docMenus, res);
    return res;
  }

  async getSnippet(path: string) {
    try {
      const respJson = await this.fetchDocDetail(path);
      const doc = respJson.data;
      const titleTrees = respJson.treeData;
      this.setState({
        snippets: {
          ...this.state.snippets,
          [path]: doc,
        },
      });
    } catch (e) {
      this.setState({
        snippets: {
          ...this.state.snippets,
          [path]: e,
        },
      });
    }
  }

  private async fetchDocDetail(path: string) {
    this.setState({
      loadingCurrentDoc: true,
    });
    const resp = await this.fetchService.fetchApi("/docs/detail" + path);
    const respJson = await resp.json();
    let code = resp.status;
    let message: string;
    if (resp.status === 404) {
      message = "文档不存在。";
    }

    if (code < 200 && code > 300) {
      throw new FetchError(code, message || "服务器错误，请重试。");
    }

    return respJson;
  }

  async getDoc(path: string) {
    this.setState({
      loadingCurrentDoc: true,
    });

    try {
      const respJson = await this.fetchDocDetail(path);
      const doc = respJson.data;
      const titleTrees = respJson.treeData;
      this.setState({
        loadCurrentDocErr: undefined,
        currentDoc: doc,
        titleTrees,
        loadingCurrentDoc: false,
      });
    } catch (e) {
      this.setState({
        loadCurrentDocErr: e,
        currentDoc: undefined,
        loadingCurrentDoc: false,
      });
    }
  }
}
