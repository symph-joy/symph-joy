# 目录结构

## 约定目录结构

Joy 支持 React 和 Node 以及两者的混合应用，下面列举各种应用类型常用的约定目录结构。

### React 应用

```shell
    myapp
        src # 源代码目录
            pages    # React文件约定路由目录
            models    # ReactModel目录
            components  # React组件
            server  # 可选，server端目录
        config  # 配置目录
            config.ts  # 配置文件
        public  # 静态公共目录
            logo.png  # 静态文件
        package.json
```

### Node 应用 或者 前后端混合应用

```shell
myapp
    src # 源代码目录
        server  # 服务端代码
            controllers
            services
        client  # 可选，客户端代码
            pages    # 约定React路由目录
            models    # ReactModel目录
            components  # React组件
    config  # 配置目录
        config.ts  # 配置文件
    public  # 静态公共目录
        logo.png  # 静态文件
    package.json
```

## 目录说明

### .joy 目录

Joy 在运行时自动生成的目录，是 Joy 必须的，但可以随时清除，Joy 在下次运行时重新生成该目录。
日常开发时，我们不用去关注和修改里面的文件。
里面主要包含的文件有：

- 用于代码扫描分析的临时文件，以及分析后的产出物。
- webpack 构建的缓存、日志物。
- Joy 应用运行加载的源文件，这些文件是编译打包后的源文件。

### out 目录

运行`joy export` 命令的默认输出目录，存放 React 导出后的静态文件，部署该目录到静态文件服务器即可，例如 Nginx 。

### .env

[dotenv](https://github.com/motdotla/dotenv) 环境变量配置文件。
例如：

```shell
port=8888
host=localhost
```

### server 目录

服务端相关代码，如果不需要服务端提供后端服务，可以没有该目录。

### client 目录

React 客户端应用相关的代码，该目录可选：

- `client`这级目录可以省略，直接在`src`下创建 React 的源代码文件，例如`src/pages/index.tsx`。
- 如果应用只提供 Api 服务，不需要前端 React 界面，可以没有该目录。

### client/pages 或者 pages 目录

React 约定文件路由目录，具体使用方法，请查看路由相关章节。
