import React, { ReactNode } from "react";
import { Layout, Menu, AutoComplete, Button } from "antd";
import { Autowire } from "@symph/core";
import { DocsModel } from "../model/docs.model";
import _ from "lodash";
import { BaseReactController, ReactController, RouteSwitch } from "@symph/react";
import Icon, { MenuUnfoldOutlined, MenuFoldOutlined, CloseOutlined } from "@ant-design/icons";
import styles from "./layout.less";
import { LayoutModel } from "../model/layout.model";

const { Content } = Layout;
const { Option } = AutoComplete;
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

@ReactController()
export default class MainLayout extends BaseReactController<any> {
  @Autowire()
  public layoutModel: LayoutModel;

  @Autowire()
  public docsModel: DocsModel;

  search: string;

  componentDidMount() {
    super.componentDidMount();
    this.appendLink();

    const oBtn = document.getElementById("collapseBtn");
    const oBody = document.getElementsByTagName("body")[0];

    const observer = new IntersectionObserver(([entry]) => {
      const { intersectionRatio } = entry;

      if (intersectionRatio === 1) {
        this.layoutModel.changeIsMobile(true);
        oBody.setAttribute("data-is-mobile", "true");
      } else {
        this.layoutModel.changeIsMobile(false);
        oBody.setAttribute("data-is-mobile", "false");
      }
    });

    observer.observe(oBtn);

    this.layoutModel.setObserver(observer);
  }

  onChange = async (value) => {
    console.log(value, "123");
    if (value) {
      await this.docsModel.getSearch(value);
    } else {
      await this.docsModel.clearSearch();
    }
  };
  componentWillUnmount() {
    super.componentWillUnmount();

    const { observer } = this.layoutModel.state;
    const oBtn = document.getElementById("collapseBtn");

    observer.unobserve(oBtn);
  }

  jump = async (value) => {
    if (value.children) {
      this.props.history.push(`/docs${value.path}${value.children[0].id}`);
    } else {
      this.props.history.push(`/docs${value.path}`);
    }
    await this.docsModel.clearSearch();
  };

  // 切换样式文件
  appendLink = () => {
    const { theme } = this.layoutModel.state;
    let link = document.getElementById("theme-style") as HTMLLinkElement;
    const oBody = document.getElementsByTagName("body")[0];

    if (!link) {
      link = document.createElement("link");
      link.type = "text/css";
      link.rel = "stylesheet";
      link.id = "theme-style";

      document.body.appendChild(link);
    }

    link.href = theme === "dark" ? "/static/antd.dark.css" : "/static/antd.css";
    oBody.setAttribute("data-theme", theme);
  };

  // 处理切换主题按钮点击事件
  handleToggleThemeClick = (): void => {
    const { theme } = this.layoutModel.state;
    const newTheme = theme === "dark" ? "light" : "dark";

    this.layoutModel.changeTheme(newTheme);

    this.appendLink();
  };

  // 处理移动端展示时，菜单展示收缩按钮点击事件
  handleToggleCollapsed = () => {
    const { collapsed } = this.layoutModel.state;

    console.log("hhhhhhh");

    this.layoutModel.changeCollapsed(!collapsed);
  };

  onSelect = () => {
    this.search = "";
    this.docsModel.clearSearch();
  };

  renderView(): ReactNode {
    const { route } = this.props;
    const { result } = this.docsModel.state;
    const { collapsed, isMobile } = this.layoutModel.state;
    console.log("reslt:", result);
    return (
      <Layout className={styles.layout}>
        <header className={styles.header}>
          <nav id="nav" className={styles.nav}>
            <div id="nav-inner" className={styles.nav__inner}>
              <a id="logo" href="/" className={styles.logo}>
                <img alt="logo" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" />
                Symph Joy
              </a>
              <Button id="collapseBtn" className={styles.menu__collapseBtn} type="text" size="large" onClick={this.handleToggleCollapsed}>
                {React.createElement(this.state.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
              </Button>
              <Menu className={styles.menu + " " + (collapsed ? styles.menu__collapsed : "")} mode={isMobile ? "vertical" : "horizontal"}>
                {isMobile && (
                  <MenuItem key="0" className={styles.menu__closeItem}>
                    <CloseOutlined onClick={this.handleToggleCollapsed} />
                  </MenuItem>
                )}
                <MenuItem key="1">开始</MenuItem>
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
                      value={this.search}
                      placeholder="搜索"
                      onSelect={this.onSelect}
                      onChange={_.debounce(this.onChange, 100)}
                      style={{ width: 200 }}
                    >
                      {result.map((value, key) => (
                        <Option key={key} value={value.text}>
                          {value.children ? (
                            <a onClick={() => this.jump(value)} className={styles.selectOption}>
                              {value.text} &gt; {value.children[0].text}
                            </a>
                          ) : (
                            <a onClick={() => this.jump(value)} className={styles.selectOption}>
                              {value.text}
                            </a>
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
