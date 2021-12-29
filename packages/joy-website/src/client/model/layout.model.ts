import { BaseReactModel, ReactModel } from "@symph/react";

export type ThemeTypes = "light" | "dark";

export interface ILayoutModelState {
  collapsed: boolean; // 菜单是否收缩
  isMobile: boolean; // 是否是移动端
}

@ReactModel()
export class LayoutModel extends BaseReactModel<ILayoutModelState> {
  getInitState(): ILayoutModelState {
    return {
      collapsed: true,
      isMobile: false,
    };
  }

  changeCollapsed(collapsed: boolean) {
    this.setState({
      collapsed,
    });
  }

  changeIsMobile(isMobile: boolean) {
    this.setState({
      isMobile,
    });
  }
}
