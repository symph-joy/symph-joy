import { ReactBaseModel, ReactModel } from "@symph/react";
import { ReactFetchService } from "@symph/joy";
import { Autowire } from "@symph/core";

export interface DocMenuItem {
  title: string;
  path: string;
  children: DocMenuItem[];
}

export type DocsModelState = {
  docMenus: DocMenuItem[];
  loadingCurrentDoc: boolean;
  loadCurrentDocErr?: { code: number; message: string };
  currentDoc: DocMenuItem & { htmlContent };
};

@ReactModel()
export class DocsModel extends ReactBaseModel<DocsModelState> {
  constructor(@Autowire("joyFetchService") private fetchService: ReactFetchService) {
    super();
  }

  getInitState(): DocsModelState {
    return {
      loadingCurrentDoc: false,
      docMenus: [],
      currentDoc: undefined,
    };
  }

  async getDocMenus() {
    const resp = await this.fetchService.fetchApi("/docs/menus");
    const respJson = await resp.json();
    this.setState({
      docMenus: respJson.data,
    });
  }

  async getDoc(path: string) {
    this.setState({
      loadingCurrentDoc: true,
    });
    const resp = await this.fetchService.fetchApi("/docs/detail?path=" + encodeURIComponent(path));
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
    this.setState({
      loadCurrentDocErr: undefined,
      currentDoc: doc,
      loadingCurrentDoc: false,
    });
  }
}
