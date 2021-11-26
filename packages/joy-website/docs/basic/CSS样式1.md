# CSS样式1

## 应用全局样式

Joy 中约定在 `src/global.css`（或`global.less` `global.sass` ）中定义全局样式，应用启动时会自动加载该样式。

比如我们给应用统一设置全局样式，或者覆盖组件样式，新建文件 `src/global.css`:

```css
body {
  font-family: BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif;
  font-size: 14px;
  padding: 20px 20px 60px;
}

.addButton {
  width: 60px;
}
```

## CSS 模块导入

Joy 会对导入的 CSS 文件自动识别是否使用 CSS Modules 导入.

### CSS Modules 导入

[CSS Modules](https://github.com/css-modules/css-modules) 会将 css 文件内的 class 名称生成唯一的标识，从而避免不同 css 模块类相同 class 名称的冲突。 通常使用 CSS Modules 来定义组件样式，而不用担心和组件间以及全局样式的冲突。

```js
// CSS Modules
import styles from "./foo.css";

export function Button() {
  return <button className={styles.btnAdd}>Add</button>;
}
```

在 CSS Modules 中，也可以通过`:global { }`包裹方式，临时插入全局类样式，被包裹中的代码中定义的 CSS 类名，将不会被 CSS Modules 处理，直接输出到页面。
例如我们自定义 header 中的菜单组件样式：

```less
// main-layout.less
.appHeader {
  height: 64px;

  :global {
    .ant-menu {
      // ant-menu 是 antd <Menu /> 组件中的常量类名。
      border: 0;
    }
  }
}
```

### 全局样式导入

非 CSS Modules 方式导入，css 文件内定义的类样式为全局样式，将会控制页面中所有满足条件的 DOM 元素。

```js
// 非 CSS Modules
import "./foo.css";

export function Button() {
  return <button className="btnAdd">New</button>;
}

// 非 CSS Modules, bar.css内定义的样式为全局样式，将会控制页面中所有满足条件的DOM元素。
import "./bar.css";
```

## 使用 LESS

Joy 原生支持 Less，使用 `.less` 后缀名定义 Less 文件。在使用 Less 之前，需要先安装 [less](https://github.com/less/less.js):

```bash
npm install less
```

### 自定义 LESS 配置

在 `joy.config.js` 的 `lessOptions` 字段中定义 Less 的自定义配置, 具体可配置项参考 [less-loader](https://webpack.js.org/loaders/less-loader/) 的配置。

```js
const path = require("path");

module.exports = {
  lessOptions: {
    strictMath: true,
  },
};
```

## 使用 Sass

Joy 原生支持 Sass，使用 `.scss` 或 `.sass` 后缀名定义 Sass 文件，在使用 Sass 之前，需要先安装 [sass](https://github.com/sass/sass) :

```bash
npm install sass
```

> Sass 支持 2 种语法格式定义来样式，`.scss`文件使用[SCSS 语法](https://sass-lang.com/documentation/syntax#scss) ，`.sass`文件使用 [Indented Syntax ("Sass")](https://sass-lang.com/documentation/syntax#the-indented-syntax) 语法。
> 如果你不确定使用哪种语法，可首先采用`.scss`，它是 CSS 的扩展，可使用 CSS 的全部语法，不需要学习新的 Indented Syntax 缩进语法。

### 自定义 Sass 配置

在 `joy.config.js` 的 `sassOptions` 字段中定义 Sass 的自定义配置, 具体可配置项参考 [sass-loader](https://webpack.js.org/loaders/sass-loader/) 的配置。

```js
const path = require("path");

module.exports = {
  sassOptions: {
    additionalData: "$env: " + process.env.NODE_ENV + ";",
    indentWidth: 4,
    includePaths: ["/absolute/path/a", "/absolute/path/b"],
  },
};
```

### Sass 变量

Joy 支持 Sass 变量从 CSS Module 文件中导出。比如导出`primaryColor`变量：

```scss
/* index-scss-variables.scss */
$primary-color: #ff0000;

:export {
  primaryColor: $primary-color;
}
```

```tsx
// index-scss-variables.js
import variables from "../index-scss-variables.scss";

export default function MyApp({ Component, pageProps }) {
  return <div style={{ color: variables.primaryColor }}>Hello</div>;
}
```

## todo

- 自定义 PostCss https://nextjs.org/docs/advanced-features/customizing-postcss-config
