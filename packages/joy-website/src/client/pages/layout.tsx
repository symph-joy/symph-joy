import React, { ReactNode } from "react";
import { Layout, Menu, AutoComplete, Button, Input } from "antd";
import { Inject } from "@symph/core";
import { DocsModel } from "../model/docs.model";
import { BaseReactController, ReactController } from "@symph/react";
import { Outlet, Link } from "@symph/react/router-dom";
import Icon, { MenuUnfoldOutlined, MenuFoldOutlined, CloseOutlined, SearchOutlined } from "@ant-design/icons";
import styles from "./layout.less";
import { LayoutModel } from "../model/layout.model";
import { getTheme, changeTheme } from "../utils/theme";

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
  hash: string;
  // 用来控制主题色选择时的样式
  themeSelectAfterVisible: boolean;
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
    hash: "",
    themeSelectAfterVisible: false,
  };

  onChange = (value: string) => {
    this.setState({
      search: value,
    });
    if (value) {
      this.docsModel.getSearch(value);
    } else {
      this.docsModel.clearSearch();
    }
  };

  onSelect = (v) => {
    const value = JSON.parse(v);
    const prePath = window.location.pathname;
    if (value?.children) {
      this.pushHistory(`${value.path}${value.children[0]?.id}`);
      if (prePath === value.path) {
        this.scrollEle();
      }
    } else {
      this.pushHistory(`${value.path}`);
    }
    // 将前一个值赋值给当前search
    this.setState({
      search: this.state.search,
    });
    this.docsModel.getSearch(this.state.search);
  };

  scrollEle() {
    const hash = window.location.hash?.slice(1);
    const ele = document.getElementById(hash);
    if (ele) {
      ele.scrollIntoView();
    }
  }

  componentDidMount() {
    super.componentDidMount();
    const theme = getTheme();
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

  componentWillUnmount() {
    super.componentWillUnmount();

    const { observer } = this.state;
    const oBtn = document.getElementById("collapseBtn");

    observer && observer.unobserve(oBtn);
  }

  // 处理切换主题按钮点击事件
  handleToggleThemeClick = (): void => {
    changeTheme();
  };

  // 处理移动端展示时，菜单展示收缩按钮点击事件
  handleToggleCollapsed = () => {
    const { collapsed } = this.layoutModel.state;

    this.layoutModel.changeCollapsed(!collapsed);
  };

  pushHistory = (url) => {
    const { navigate } = this.props;
    navigate(url);
  };

  handleThemeSelectMouseEnter = () => {
    this.setState({
      themeSelectAfterVisible: true,
    });
  };

  renderView(): ReactNode {
    const { result } = this.docsModel.state;
    const { collapsed, isMobile } = this.layoutModel.state;

    return (
      <Layout className={styles.layout}>
        <header className={styles.header}>
          <nav id="nav" className={styles.nav}>
            <div id="nav-inner" className={styles.nav__inner}>
              <Link id="logo" to="/" className={styles.logo}>
                {/* <img alt="logo" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" /> */}
                Symph Joy
              </Link>
              <Button id="collapseBtn" className={styles.menu__collapseBtn} type="text" size="large" onClick={this.handleToggleCollapsed}>
                {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
              </Button>

              <Menu className={styles.menu + " " + (collapsed ? styles.menu__collapsed : "")} mode={isMobile ? "vertical" : "horizontal"}>
                {isMobile && (
                  <MenuItem key="0" className={styles.menu__closeItem}>
                    <CloseOutlined onClick={this.handleToggleCollapsed} />
                  </MenuItem>
                )}
                {!isMobile && (
                  <MenuItem key="9">
                    <AutoComplete
                      allowClear
                      value={this.state.search}
                      onSelect={this.onSelect}
                      onChange={this.onChange}
                      style={{ width: 200 }}
                      options={result.map((value, key) => ({
                        value: JSON.stringify(value),
                        label: (
                          <div key={key}>
                            {value.children ? (
                              <a>
                                {value.text} &gt; {value.children[0].text}
                              </a>
                            ) : (
                              <a>{value.text}</a>
                            )}
                          </div>
                        ),
                      }))}
                    >
                      <Input prefix={<SearchOutlined />} placeholder="搜索" />
                    </AutoComplete>
                  </MenuItem>
                )}
                <MenuItem key="1">
                  <a onClick={this.pushHistory.bind(this, "/docs/docs/start/introduce")}>开始</a>
                </MenuItem>
                <MenuItem key="2">
                  <Link to="/docs/config/start/introduce">配置</Link>
                </MenuItem>
                <MenuItem key="3">
                  <Link to="/docs/api/start/introduce">API</Link>
                </MenuItem>
                <MenuItem key="4">指南</MenuItem>
                <MenuItem key="5">插件</MenuItem>
                <MenuItem key="8">
                  <Link to="/docs/v1/readme">v1</Link>
                </MenuItem>
                <MenuItem key="6">
                  <a target="_blank" href="https://github.com/lnlfps/symph-joy">
                    Github
                  </a>
                </MenuItem>
                {!isMobile && [
                  <MenuItem key="7">
                    <a id="change-theme" className={styles.theme__switch} onClick={this.handleToggleThemeClick}>
                      <span>
                        <Icon component={SunSvg} />
                        <Icon component={MoonSvg} />
                      </span>
                    </a>
                  </MenuItem>,
                ]}
              </Menu>
            </div>
          </nav>
        </header>
        <Content className={styles.appContent}>
          <Outlet />
        </Content>
      </Layout>
    );
  }
}
