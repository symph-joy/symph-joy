import React, { ReactNode } from "react";
import { Layout, Menu, Breadcrumb, Row, Col, AutoComplete } from "antd";
import { Autowire } from "@symph/core";
import { UserOutlined, LaptopOutlined, NotificationOutlined } from "@ant-design/icons";
import { DocsModel } from "../model/docs.model";
import _ from "lodash";
import { ReactBaseController, ReactController, RouteSwitch } from "@symph/react";
import Icon, { SearchOutlined } from "@ant-design/icons";
import styles from "./layout.less";
import { LayoutModel } from "../model/layout.model";
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;
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
export default class MainLayout extends ReactBaseController<any> {
  @Autowire()
  public layoutModel: LayoutModel;

  @Autowire()
  public docsModel: DocsModel;

  componentDidMount() {
    this.appendLink();
  }

  onChange = async (value) => {
    const result = await this.docsModel.getSearch(value);
  };
  jump = (value) => {
    if (value.children) {
      this.props.history.push(`/docs${value.path}${value.children[0].id}`);
    } else {
      this.props.history.push(`/docs${value.path}`);
    }
  };

  appendLink = () => {
    const { theme } = this.layoutModel.state;
    let link = document.getElementById("theme-style") as HTMLLinkElement;

    if (!link) {
      link = document.createElement("link");
      link.type = "text/css";
      link.rel = "stylesheet";
      link.id = "theme-style";

      document.body.appendChild(link);
    }

    link.href = theme === "dark" ? "/static/antd.dark.css" : "/static/antd.css";
  };

  handleToggleThemeClick = (): void => {
    const { theme } = this.layoutModel.state;
    const newTheme = theme === "dark" ? "light" : "dark";

    this.layoutModel.changeTheme(newTheme);

    this.appendLink();
  };
  renderView(): ReactNode {
    const { route } = this.props;
    const { theme } = this.layoutModel.state;
    const { result } = this.docsModel.state;
    console.log("theme: ", theme);

    return (
      <Layout className={styles.layout} data-theme={theme}>
        <header className={styles.header}>
          <nav id="nav" className={styles.nav}>
            <div id="nav-inner" className={styles.nav__inner}>
              <a id="logo" href="/" className={styles.logo}>
                <img alt="logo" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" />
                Symph Joy
              </a>
              <Menu className={styles.menu} mode="horizontal" inlineCollapsed={false}>
                <MenuItem key="1">开始</MenuItem>
                <MenuItem key="2">配置</MenuItem>
                <MenuItem key="3">API</MenuItem>
                <MenuItem key="4">指南</MenuItem>
                <MenuItem key="5">插件</MenuItem>
                <MenuItem key="6">
                  <a id="change-theme" className={styles.theme__switch} onClick={this.handleToggleThemeClick}>
                    <span className={theme === "dark" ? styles.darkTheme : ""}>
                      <Icon component={SunSvg} />
                      <Icon component={MoonSvg} />
                    </span>
                  </a>
                </MenuItem>
                <MenuItem key="7">
                  <AutoComplete className={styles.search} onChange={_.debounce(this.onChange, 100)} style={{ width: 200 }}>
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
                </MenuItem>
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
