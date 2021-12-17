import { BaseReactModel, ReactModel } from "@symph/react";

export type ThemeTypes = "light" | "dark";

export interface ILayoutModelState {
  theme: ThemeTypes; //当前主题
  collapsed: boolean; // 菜单是否收缩
  isMobile: boolean; // 是否是移动端
}

@ReactModel()
export class LayoutModel extends BaseReactModel<ILayoutModelState> {
  getInitState(): ILayoutModelState {
    let theme = "light";
    if (typeof window !== "undefined") {
      theme = localStorage.getItem("theme") || "light";
    }

    return {
      theme: theme as ThemeTypes,
      collapsed: true,
      isMobile: false,
    };
  }

  changeTheme(theme: ThemeTypes) {
    localStorage.setItem("theme", theme);

    this.setState({
      theme,
    });
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
