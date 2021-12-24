import React, { ReactNode } from "react";
import { Layout, Menu, AutoComplete, Button } from "antd";
import { Inject } from "@symph/core";
import { DocsModel } from "../model/docs.model";
import { BaseReactController, ReactController, RouteSwitch } from "@symph/react";
import Icon, { MenuUnfoldOutlined, MenuFoldOutlined, CloseOutlined } from "@ant-design/icons";
import styles from "./layout.less";
import { LayoutModel } from "../model/layout.model";
const { Option } = AutoComplete;
const { Content } = Layout;
const { Item: MenuItem } = Menu;
const SunSvg = () => (
  <svg viewBox="0 0 1024 1024" fill="currentColor" width="1em" height="1em">
    <path
      d="M512 832a64 64 0 0 1 64 64v64a64 64 0 1 1-128 0v-64a64 64 0 0 1 64-64z m0-640a64 64 0 0 1-64-64V64a64 64 0 1 1 128 0v64a64 64 0 0 1-64 64z m448 256a64 64 0 1 1 0 128h-64a64 64 0 1 1 0-128h64zM192 512a64 64 0 0 1-64 64H64a64 64 0 1 1 0-128h64a64 64 0 0 1 64 64z m636.768 226.272l45.248 45.248a64 64 0 1 1-90.496 90.496l-45.248-45.248a64 64 0 1 1 90.496-90.496zM195.232 285.728L149.984 240.48a64 64 0 1 1 90.496-90.496l45.248 45.248a64 64 0 1 1-90.496 90.496z m633.536 0a64 64 0 1 1-90.496-90.496l45.248-45.248a64 64 0 1 1 90.496 90.496l-45.248 45.248zM195.232 738.272a64 64 0 1 1 90.496 90.496l-45.248 45.248a64 64 0 1 1-90.496-90.496l45.248-45.248zM512 256a256 256 0 1 0 0 512 256 256 0 0 0 0-512z m0 416a160 160 0 1 1 0.032-320.032A160 160 0 0 1 512 672z"
      p-id="2605"
    ></path>
  </svg>
);
const MoonSvg = () => (
  <svg viewBox="0 0 1024 1024" fill="currentColor" width="1em" height="1em">
    <path
      d="M514.56 938.666667h-40.106667a426.666667 426.666667 0 0 1 0-853.333334 42.666667 42.666667 0 0 1 42.666667 21.76A42.666667 42.666667 0 0 1 512 153.173333a256 256 0 0 0 358.4 358.4 42.666667 42.666667 0 0 1 46.08-2.986666 42.666667 42.666667 0 0 1 21.76 42.666666A426.666667 426.666667 0 0 1 514.56 938.666667zM397.226667 189.44a341.333333 341.333333 0 1 0 437.333333 437.333333A341.333333 341.333333 0 0 1 381.013333 356.266667a341.333333 341.333333 0 0 1 16.213334-166.826667z"
      p-id="3227"
    ></path>
  </svg>
);

interface IStateProps {
  search: string;
  // 观察菜单展开收缩按钮，根据按钮是否显示决定当前是移动端还是web端
  observer: IntersectionObserver;
}

@ReactController()
export default class MainLayout extends BaseReactController<any, IStateProps> {
  @Inject()
  public layoutModel: LayoutModel;

  @Inject()
  public docsModel: DocsModel;

  state: IStateProps = {
    search: "",
    observer: undefined,
  };

  componentDidMount() {
    super.componentDidMount();

    const { theme } = this.layoutModel.state;
    const oBtn = document.getElementById("collapseBtn");
    const oBody = document.getElementsByTagName("body")[0];

    oBody.setAttribute("data-theme", theme);

    const observer = new IntersectionObserver(([entry]) => {
      const { intersectionRatio } = entry;

      if (intersectionRatio > 0) {
        this.layoutModel.changeIsMobile(true);
        oBody.setAttribute("data-is-mobile", "true");
      } else {
        this.layoutModel.changeIsMobile(false);
        oBody.setAttribute("data-is-mobile", "false");
      }
    });

    observer.observe(oBtn);

    this.setState({
      observer,
    });
  }

  onChange = async (value) => {
    this.setState({
      search: value,
    });
    if (value) {
      await this.docsModel.getSearch(value);
    } else {
      await this.docsModel.clearSearch();
    }
  };

  onSelect = async (v, option) => {
    const value = this.docsModel.state.result[option.key];
    if (value.children) {
      this.pushHistory(`/docs${value.path}${value.children[0].id}`);
    } else {
      this.pushHistory(`/docs${value.path}`);
    }
    this.setState({
      search: this.state.search,
    });
    await this.docsModel.getSearch(this.state.search);
  };

  componentWillUnmount() {
    super.componentWillUnmount();

    const { observer } = this.state;
    const oBtn = document.getElementById("collapseBtn");

    observer && observer.unobserve(oBtn);
  }

  // 切换样式文件
  changeBodyTheme = () => {
    const { theme } = this.layoutModel.state;
    const oBody = document.getElementsByTagName("body")[0];

    oBody.setAttribute("data-theme", theme);
  };

  // 处理切换主题按钮点击事件
  handleToggleThemeClick = (): void => {
    const { theme } = this.layoutModel.state;
    const newTheme = theme === "dark" ? "light" : "dark";

    this.layoutModel.changeTheme(newTheme);

    this.changeBodyTheme();
  };

  // 处理移动端展示时，菜单展示收缩按钮点击事件
  handleToggleCollapsed = () => {
    const { collapsed } = this.layoutModel.state;

    this.layoutModel.changeCollapsed(!collapsed);
  };

  pushHistory = (url) => {
    const { history } = this.props;
    history.push(url);
  };

  renderView(): ReactNode {
    const { route } = this.props;
    const { result } = this.docsModel.state;
    const { collapsed, isMobile, theme } = this.layoutModel.state;
    const themeUrl = theme === "dark" ? "/static/antd.dark.css" : "/static/antd.css";

    return (
      <Layout className={styles.layout}>
        <link id="theme-style" rel="stylesheet" href={themeUrl} />
        <header className={styles.header}>
          <nav id="nav" className={styles.nav}>
            <div id="nav-inner" className={styles.nav__inner}>
              <a id="logo" href="/" className={styles.logo}>
                <img alt="logo" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" />
                Symph Joy
              </a>
              <Button id="collapseBtn" className={styles.menu__collapseBtn} type="text" size="large" onClick={this.handleToggleCollapsed}>
                {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
              </Button>
              <Menu className={styles.menu + " " + (collapsed ? styles.menu__collapsed : "")} mode={isMobile ? "vertical" : "horizontal"}>
                {isMobile && (
                  <MenuItem key="0" className={styles.menu__closeItem}>
                    <CloseOutlined onClick={this.handleToggleCollapsed} />
                  </MenuItem>
                )}
                <MenuItem key="1">
                  <a href={"/docs"} onClick={this.pushHistory.bind(this, "/docs")}>
                    开始
                  </a>
                </MenuItem>
                <MenuItem key="2">配置</MenuItem>
                <MenuItem key="3">API</MenuItem>
                <MenuItem key="4">指南</MenuItem>
                <MenuItem key="5">插件</MenuItem>
                {!isMobile && [
                  <MenuItem key="6">
                    <a id="change-theme" className={styles.theme__switch} onClick={this.handleToggleThemeClick}>
                      <span>
                        <Icon component={SunSvg} />
                        <Icon component={MoonSvg} />
                      </span>
                    </a>
                  </MenuItem>,
                  <MenuItem key="7">
                    <AutoComplete
                      allowClear
                      value={this.state.search}
                      placeholder="搜索"
                      onSelect={this.onSelect}
                      onChange={this.onChange}
                      style={{ width: 200 }}
                    >
                      {result.map((value, key) => (
                        <Option key={key} value={value.children ? `${value.text} &gt; ${value.children[0].text}` : value.text}>
                          {value.children ? (
                            <a className={styles.selectOption}>
                              {value.text} &gt; {value.children[0].text}
                            </a>
                          ) : (
                            <a className={styles.selectOption}>{value.text}</a>
                          )}
                        </Option>
                      ))}
                    </AutoComplete>
                  </MenuItem>,
                ]}
              </Menu>
            </div>
          </nav>
        </header>
        <Content className={styles.appContent}>
          <RouteSwitch routes={route?.routes || []} extraProps={null} />
        </Content>
      </Layout>
    );
  }
}
