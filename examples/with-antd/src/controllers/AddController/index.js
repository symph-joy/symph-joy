import React, { PureComponent } from 'react'
import styles from './index.less'
import DataModel from '../../models/model'
import { routerRedux } from '@symph/joy/router'
import { controller } from '@symph/joy/controller'
import { autowire } from '@symph/joy/autowire'
import { Form, Input, Breadcrumb, DatePicker, Button, notification } from 'antd'

@controller(state => ({model: state.model}))
class AddController extends PureComponent {

  @autowire()
  dataModel: DataModel

  // 提交表单
  onSubmit = e => {
    const {form: {validateFields}, dispatch} = this.props
    e.preventDefault()
    validateFields(async (err, data) => {
      if (err) {
        return
      }
      await this.dataModel.add({data})
      notification.success({
        duration: 2,
        message: '添加成功提醒',
        description: '恭喜您， 添加项目成功'
      })
      // 延迟2S跳转至列表页面
      setTimeout(() => {
        dispatch(routerRedux.push('/main/data/list'))
      }, 2000)
    })
  }

  render () {
    const {form: {getFieldDecorator}} = this.props
    // FormItem配置项
    const itemOption = {
      required: true,
      hasFeedback: true,
      labelCol: {span: 4},
      wrapperCol: {span: 6}
    }
    return (
      <section className={styles.page}>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item>项目管理</Breadcrumb.Item>
          <Breadcrumb.Item>添加项目</Breadcrumb.Item>
        </Breadcrumb>
        <Form className={styles.content}
              layout="horizontal"
              onSubmit={this.onSubmit}
        >
          <Form.Item label="项目名称"
                     {...itemOption}
          >
            {getFieldDecorator('name', {
              rules: [
                {required: true, message: '请填写项目名称'},
                {min: 2, message: '项目名称长度不能小于2'},
                {max: 15, message: '项目名称长度不能大于15'},
              ]
            })(
              <Input placeholder="项目名称" size="large"/>
            )}
          </Form.Item>
          <Form.Item label="创建日期"
                     {...itemOption}
          >
            {getFieldDecorator('createDate', {
              rules: [
                {required: true, message: '请选择创建日期'}
              ]
            })(
              <DatePicker className={styles.datePicker} size="large"
                          placeholder="选择日期"/>
            )}
          </Form.Item>
          <Form.Item label="管理员账号"
                     {...itemOption}
          >
            {getFieldDecorator('email', {
              rules: [
                {required: true, message: '请填写管理员邮箱账号'},
                {email: true, message: '邮箱账号不正确'},
              ]
            })(
              <Input placeholder="请填写管理员邮箱账号" size="large"/>
            )}
          </Form.Item>
          <Form.Item label="git仓库地址"
                     {...itemOption}
          >
            {getFieldDecorator('gitPath', {
              rules: [
                {required: true, message: '请填写git仓库地址'}
              ]
            })(
              <Input placeholder="填写git仓库地址" size="large"/>
            )}
          </Form.Item>
          <Form.Item label="项目介绍"
                     {...itemOption}
          >
            {getFieldDecorator('desc', {
              rules: [
                {required: true, message: '请填写项目介绍'}
              ]
            })(
              <Input.TextArea placeholder="填写项目介绍"/>
            )}
          </Form.Item>
          <Form.Item
            wrapperCol={{span: 6, offset: 4}}
          >
            <Button type="primary"
                    className={styles.btn}
                    htmlType="submit"
            >提交</Button>
          </Form.Item>
        </Form>
      </section>
    )
  }
}

export default Form.create()(AddController)
