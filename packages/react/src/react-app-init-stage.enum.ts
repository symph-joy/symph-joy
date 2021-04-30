/**
 * 当前的初始阶段，数值越大，初始化程度越高。
 * 只在服务端时渲染使用，客户端使用固定的默认值。
 */
export enum EnumReactAppInitStage {
  STATIC, // 只初始化页面静态数据
  DYNAMIC, // 初始化页面的静态数据和动态数据
  DEFAULT = 99, // 默认值，初始化所有的数据
}
