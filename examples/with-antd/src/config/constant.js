import getConfig from '@symph/joy/config';

const {publicRuntimeConfig: {env}} = getConfig();

export const menus = [
  {
    title: '项目管理', 
    icon: 'area-chart', 
    children: [
      {
        title: '项目仓库',
        path: '/main/data/list'
      },
      {
        title: '新增项目',
        path: '/main/data/add'
      }
    ]
  },
  {
    title: '关于',
    icon: 'info-circle-o',
    path: '/main/about'
  }
];

// 请求远程服务器地址
export const apiPath = env === 'production'
  ? '/'  //生产环境地址
  : '/';  // 非生产环境地址

export default {
  menus,
  apiPath
}