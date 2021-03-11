import styles from './index.less';
import React, {PureComponent} from 'react';
import {Link} from '@symph/joy/router';
import {Icon, Menu} from 'antd';

export default class Sider extends PureComponent {
  render() {
    const {menus} = this.props;
    if (!(menus && menus.length > 0)) {
      return null;
    }
    // 展开项（都展开）
    const openKeys = menus.map(m => {
      return `${m.title}`;
    });
    return (
      <React.Fragment>
        <Link className={styles.logoBox} to="/">
          <Icon type="zhihu" />
          <span className={styles.logo}>项目管理</span>
        </Link>
        <Menu mode="inline"
          // defaultSelectedKeys={this.state.selectKey}
          defaultOpenKeys={openKeys}
          theme="dark"
        >
          {(menus || []).map(m => {
            return m.path 
            ? (
              <Menu.Item key={m.path}>
                <Link to={m.path}>
                  <Icon type={m.icon} />
                  <span>{m.title}</span>
                </Link>
              </Menu.Item>
            )
            : (
              <Menu.SubMenu key={m.title} 
                title={<span><Icon type={m.icon} /><span>{m.title}</span></span>}>
                {(m.children || []).map(ms => {
                  return (
                    <Menu.Item key={ms.path}>
                      <Link to={ms.path}>{ms.title}</Link>
                    </Menu.Item>
                  );
                })}
              </Menu.SubMenu>
            )
          })}
        </Menu>
      </React.Fragment>
    );
  }
}