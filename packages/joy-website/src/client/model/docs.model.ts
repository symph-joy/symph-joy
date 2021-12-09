import { BaseReactModel, ReactModel } from "@symph/react";
import { ReactFetchService } from "@symph/joy";
import { Autowire } from "@symph/core";

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
  defaultOption: Array<string>;
};

@ReactModel()
export class DocsModel extends BaseReactModel<DocsModelState> {
  constructor(@Autowire("joyFetchService") private fetchService: ReactFetchService) {
    super();
  }

  getInitState(): DocsModelState {
    return {
      loadingCurrentDoc: false,
      docMenus: [],
      titleTrees: [],
      currentDoc: undefined,
      result: [],
      defaultOption: [],
    };
  }

  async getSearch(value) {
    const res = [];
    const resp = await this.fetchService.fetchApi("/docs/titleArray");
    const respJson = await resp.json();
    const titleArray = respJson.data;
    for (const h1 of titleArray) {
      if (h1.text.includes(value) || h1.text.toLowerCase().includes(value.toLowerCase())) {
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
          if (h2.text.includes(value) || h2.text.toLowerCase().includes(value.toLowerCase())) {
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
    this.setState({
      result: res,
    });
  }

  async clearSearch() {
    this.setState({
      result: [],
    });
  }

  async getDocMenus(): Promise<DocMenuItem[]> {
    const resp = await this.fetchService.fetchApi("/docs/menus");
    const respJson = await resp.json();
    const defaultOption = await this.getDefaultOpenKeys(respJson.data);
    this.setState({
      docMenus: respJson.data,
      defaultOption,
    });
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

  async getDoc(path: string) {
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
    if (code >= 400) {
      this.setState({
        loadCurrentDocErr: {
          code,
          message: message || "服务器错误，请重试。",
        },
        currentDoc: undefined,
        loadingCurrentDoc: false,
      });
      return;
    }

    const doc = respJson.data;
    const titleTrees = respJson.treeData;
    this.setState({
      loadCurrentDocErr: undefined,
      currentDoc: doc,
      titleTrees,
      loadingCurrentDoc: false,
    });
  }
}
