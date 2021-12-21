# JOY 配置

## basePath

类型：`string` 默认值：`""`

发布 Joy 应用到子路径下时，使用`basePath`设置子路径名称。 例如我们开发了一个文档应用，现将它发布到`/docs`子路径下，例如`www.mydomian.com/docs`。

```typescript
// config/config.production.ts
// 只配置 production 环境
export default {
  basePath: "/docs",
};
```

> 注意：该配置值在构建编译时设置，会打包到客户端的运行包中，如果修改该值，需要重新编译。

## assetPrefix

类型：string，默认:`""`

在浏览器上运行时，加载应用资源的路径前缀。一般是在生产环境，将打包好的静态资源部署到不同的服务器（CDN，静态文件服务器）上时配置该值，而开发调试环境无需配置。 例如图片默认路径是`${basePath}/static/logo.png`，假如我们将资源部署到 CDN 上，图片的加载路径变为 CDN 的地址`https://cdn.mydomain.com/myapp/static/logo.png` ,此时我们更改`assetPrefix`为 CDN 的地址：

```typescript
// config/config.production.ts

export default {
  assetPrefix: "https://cdn.mydomain.com/myapp",
};
```

## distDir

类型：`string`，默认: `".joy"`

编译阶段输出的临时目录，你也可以设置自定义的目录名称。
