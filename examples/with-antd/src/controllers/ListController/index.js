import styles from './index.less';
import React, {PureComponent} from 'react';
import DataModel from '../../models/model';
import {controller, autowire} from '@symph/joy/controller';
import {Table, Breadcrumb, Button} from 'antd'

@controller(state => ({model: state.model}))
export default class ListController extends PureComponent {

  @autowire()
  dataModel: DataModel

  // 删除
  del = async index => {
    await  this.dataModel.del({index});
  };

  render() {
    const {model: {list}} = this.props;
    
    const columns = [
      {title: '编号', align: 'center', key: 'id', render: (v, r, i) => i + 1},
      {title: '项目名称', align: 'center', key: 'name', dataIndex: 'name'},
      {title: '创建日期', align: 'center', key: 'createDate', dataIndex: 'createDate', render: (v) => v.format('YYYY-MM-DD')},
      {title: '管理员邮箱', align: 'center', key: 'email', dataIndex: 'email'},
      {title: 'git仓库地址', align: 'center', key: 'gitPath', dataIndex: 'gitPath'},
      {title: '项目介绍', align: 'center', key: 'desc', dataIndex: 'desc'},
      {title: '操作', align: 'center', key: 'operate', render: (v, r, i) => {
        return <Button size="small" onClick={() => this.del(i)}>删除</Button>
      }},
    ];

    return (
      <section className={styles.page}>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item>项目管理</Breadcrumb.Item>
          <Breadcrumb.Item>项目仓库</Breadcrumb.Item>
        </Breadcrumb>
        <section className={styles.content}>
          <Table className={styles.table}
            bordered
            pagination={false}
            columns={columns}
            dataSource={list}
            rowKey={(v, k) => k}
          />
        </section>
      </section>
    );
  }
}
