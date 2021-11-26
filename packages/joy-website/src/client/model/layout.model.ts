import { ReactBaseModel, ReactModel } from "@symph/react";

export type ThemeTypes = "light" | "dark";

export interface ILayoutModelState {
  theme: ThemeTypes;
}

@ReactModel()
export class LayoutModel extends ReactBaseModel<ILayoutModelState> {
  getInitState(): ILayoutModelState {
    let theme = "light";
    if (typeof window !== "undefined") {
      theme = localStorage.getItem("theme") || "light";
    }

    return {
      theme: theme as ThemeTypes,
    };
  }

  changeTheme(theme: ThemeTypes): void {
    console.log("model theme: ", theme);
    localStorage.setItem("theme", theme);

    this.setState({
      theme,
    });
  }
}
