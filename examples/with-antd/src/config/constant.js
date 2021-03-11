
export const menus = [
  {
    title: '项目管理', 
    icon: 'area-chart', 
    children: [
      {
        title: '项目仓库',
        path: '/data/list'
      },
      {
        title: '新增项目',
        path: '/data/add'
      }
    ]
  },
  {
    title: '关于',
    icon: 'info-circle-o',
    path: '/about'
  }
];

export default {
  menus,
}
