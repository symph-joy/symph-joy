# 配置

Joy 遵循约定大于配置原则，参考最佳实践约定默认配置，0 配置也可启动应用，即新应用无需配置文件也可立即运行和发布。

## 配置文件

Joy 在`joy.config.ts`或者`config/config.ts`中配置项目，支持 ts、js、json、es6 文件格式。例如：

```typescript
// joy.config.ts

export default {
  basePath: "",
  apiPrefix: "/api",
  ssr: true,
};
```

如果项目的配置不复杂，推荐在 `joy.config.ts` 中写配置; 如果项目的配置比较复杂，可以将配置写在 config/config.ts 中，并把配置的一部分拆分出去，加载配置时会自动合并到主配置中，例如路由配置可以拆分成单独的 routes.ts：

```typescript
// config/routes.ts

export default [{ exact: true, path: "/", component: "index" }];
```

等同于：

```typescript
// joy.config.ts
{
  apiPrefix: "/api";
  routes: [{ exact: true, path: "/", component: "index" }];
}
```

## 多环境配置

可以通过环境变量`NODE_ENV`或者`JOY_ENV`来区分不同环境配置，`JOY_ENV`的优先级更高。各环境配置文件，统一放在`/config`目录中，例如：`/config/config.beta.ts`、`/config/config.production.ts`。

各配置的加载顺序：`.env` ➡ `joy.config.ts` ➡ `config/config.ts` ➡ `config/config.production.ts` ， 后加载的配置会覆盖之前的配置。

## 本地临时配置

可以新建 `config/config.local.ts`文件，例如该配置文件存在，则加载顺序为：
`.env` ➡ `joy.config.ts` ➡ `config/config.ts` ➡ `config/config.development.ts` ➡ `config/config.local.ts` 。

**注意：**

- 该配置优先级最高，在最后加载该配置文件，且会覆盖之前读取的配置。
- `config.local.ts` 是本地开发调试的临时配置，请将其添加到 `.gitignore`，**务必不要提交到 git 仓库中**

## 环境变量配置

### 执行命令时添加环境变量

例如：

```bash
# OS X、 Linux
$ port=3000 joy dev

# Windows
$ set port=3000&&joy dev
```

如果要同时考虑 OS X 和 Windows，可借助三方工具 cross-env。

```bash
$ yarn add cross-env --dev
$ cross-env port=3000 umi dev
```

### .env 配置文件

Joy 约定根目录下的`.env`为环境变量配置文件，该配置文件将在初始化配置时加载，其配置的值于 [执行命令时添加环境变量](#执行命令时添加环境变量)

```typescript
// .env

port = 3000;
hostname = "localhost";
```

## 应用内获取配置

### 通过 ConfigService 服务获取

`@symph/config`提供 `ConfigService`服务类，Joy 已内置该服务，通过其提供的`get<T = any>(configPath?:string, defaultValue?: T): T | undefined`方法获取配置值，方法参数：

- configPath: 配置键值，支持 object path，获取配置值对象的内部值。
- defaultValue: 默认值，如果配置不存在，则返回默认值。

例如有以下配置内容：

```typescript
// joy.config.ts
export default {
  database: {
    type: "mysql",
    host: "localhost",
    port: 3306,
  },
};
```

在服务类中获取以上配置值：

```typescript
import { ConfigService } from "@symph/config";

import { Component } from "@symph/core";
import { Value } from "@symph/config";

@Component()
export class HelloService {
  constructor(private configService: ConfigService) {
    // 通过 configKey 获取 配置
    const database = configService.get("database");

    // 如果配置值是一个对象，可以通过object path，获取获取对象内部属性的值
    const host = configService.get<string>("database.host", "localhost");
  }
}
```

### @Value 装饰器方式获取

在组件的属性上，通过`@Value(options)`装饰器申明需要自动注入配置，注入的属性键值默认为组件的属性名称，例如：

```typescript
import { Component } from "@symph/core";
import { Value } from "@symph/config";

@Component()
export class HelloService {
  // 读取joy.config.ts中配置的msg的值。
  @Value()
  public msg: string;
}
```

`@Value(options)` 定制参数列表：

- **configKey** 类型`string`，默认等于被装饰的属性名称，指定注入是取的配置文件中的键值，由此属性名称和配置文件中的键值可以不相等。
- **schema** 类型`json-schema`，自定义 [json-schema](https://json-schema.org/learn/getting-started-step-by-step) 定义属性规则，不推荐直接使用该属性，大部分情况下可使用`@tsed/schema`库提供的装饰器来申明校验规则，例如`@Max(3)`申明该配置的值不能大于 4，否则运行是抛出异常。

[//]: # "- **onChange** 类型`string`, 默认值`undefined`，设置当该值发生变化后，系统需如何处理，目前仅支持`reload`重新启动应用，或者为空不做任何操作。"

- **transform** 类型`(configValue: any) => any`, 注入值时被调用，入参为配置文件中的值，返回值为转换后的值，然后将转化后的值设置到属性上。

> `@Value()`声明的属性，也等于声明了一个配置项及其类型和验证规则，需要避免在不同地方声明相同的配置但又不兼容的类型，这种情况下，我们可以将声明移动到一个独立的配置类中，其它地方如果需要使用该配置，应该依赖和使用该类。

#### 校验配置值

使用`@tsed/schema`库提供的装饰器来申明校验规则。

```typescript
import { Component } from "@symph/core";
import { Max, MaxLength, Required } from "@tsed/schema";
import { Value } from "@symph/config";

@Component()
export class BasicConfig {
  // 配置类型为number，且不能大于4，否则运行时抛出异常。
  // 如果未配置，默认为 2
  @Value({ default: 2 })
  @Max(4)
  public workers: number;

  // 必须配置，且长度不能大于64.
  @Value()
  @MaxLength(64)
  @Required()
  public msg: string;

  // 配置是一个负责对象数组，类型和验证规则声明在对象的类上。
  @Value()
  public routes: Route[];
}

class Route {
  @Required()
  public path: string;

  public extract: boolean;
}
```
