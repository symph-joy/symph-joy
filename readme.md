
#SYMPHONY 

Symphony-js is a minimalistic framework for server-rendered React applications.



## How to use

### Setup

Install it:

```bash
npm install --save symphony react react-dom
```

> Symphony only supports [React 16](https://reactjs.org/blog/2017/09/26/react-v16.0.html).<br/>

and add a script to your package.json like this:

```json
{
  "scripts": {
    "dev": "symphony",
    "build": "symphony build",
    "start": "symphony start"
  }
}
```

After that, populating `./src/index.js` inside your project:

```jsx
export default () => <div>Welcome to symphony!</div>
```

and then just run `npm run dev` and go to `http://localhost:3000`. To use another port, you can run `npm run dev -- -p <your port here>`.

So far, we get:

- Automatic compilation and bundling (with webpack and babel)
- Hot code reloading
- Entry point of app, exported by `./src/index.js`
- Server rendering, and auto restart 
- Static file serving. `./static/` is mapped to `/static/`

To see how simple this is, check out the [./example/hello-world](./examples/hello-world)

### CSS

#### Built-in CSS support

We bundle [styled-jsx](https://github.com/zeit/styled-jsx) to provide support for isolated scoped CSS. The aim is to support "shadow CSS" similar to Web Components, which unfortunately [do not support server-rendering and are JS-only](https://github.com/w3c/webcomponents/issues/71).

```jsx
export default () =>
  <div>
    Hello world
    <p>scoped!</p>
    <style jsx>{`
      p {
        color: blue;
      }
      div {
        background: red;
      }
      @media (max-width: 600px) {
        div {
          background: blue;
        }
      }
    `}</style>
    <style global jsx>{`
      body {
        background: black;
      }
    `}</style>
  </div>
```

Please see the [styled-jsx documentation](https://www.npmjs.com/package/styled-jsx) for more examples.

#### CSS-in-JS

<p><details>
  <summary>
    <b>Examples</b>
    </summary>
  <ul><li><a href="./examples/with-styled-components">Styled components</a></li><li><a href="./examples/with-styletron">Styletron</a></li><li><a href="./examples/with-glamor">Glamor</a></li><li><a href="./examples/with-glamorous">Glamorous</a></li><li><a href="./examples/with-cxs">Cxs</a></li><li><a href="./examples/with-aphrodite">Aphrodite</a></li><li><a href="./examples/with-fela">Fela</a></li></ul>
</details></p>

It's possible to use any existing CSS-in-JS solution. The simplest one is inline styles:

```jsx
export default () => <p style={{ color: 'red' }}>hi there</p>
```

To use more sophisticated CSS-in-JS solutions, you typically have to implement style flushing for server-side rendering. We enable this by allowing you to define your own [custom `<Document>`](#user-content-custom-document) component that wraps each page.

#### Importing CSS / Sass / Less files

To support importing `.css` `.scss` or `.less` files you can use these modules, which configure sensible defaults for server rendered applications.

- [@zeit/symphony-css](https://github.com/zeit/symphony-plugins/tree/master/packages/next-css)
- [@zeit/next-sass](https://github.com/zeit/next-plugins/tree/master/packages/next-sass)
- [@zeit/next-less](https://github.com/zeit/next-plugins/tree/master/packages/next-less)

### Static file serving (e.g.: images)

Create a folder called `static` in your project root directory. From your code you can then reference those files with `/static/` URLs:

```jsx
export default () => <img src="/static/my-image.png" />
```

### Populating `<head>`

<p><details>
  <summary><b>Examples</b></summary>
  <ul>
    <li><a href="./examples/head-elements">Head elements</a></li>
    <li><a href="./examples/layout-component">Layout component</a></li>
  </ul>
</details></p>

We expose a built-in component for appending elements to the `<head>` of the page.

```jsx
import Head from 'next/head'

export default () =>
  <div>
    <Head>
      <title>My page title</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <p>Hello world!</p>
  </div>
```

To avoid duplicate tags in your `<head>` you can use the `key` property, which will make sure the tag is only rendered once:

```jsx
import Head from 'next/head'
export default () => (
  <div>
    <Head>
      <title>My page title</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport" />
    </Head>
    <Head>
      <meta name="viewport" content="initial-scale=1.2, width=device-width" key="viewport" />
    </Head>
    <p>Hello world!</p>
  </div>
)
```

In this case only the second `<meta name="viewport" />` is rendered.

_Note: The contents of `<head>` get cleared upon unmounting the component, so make sure each page completely defines what it needs in `<head>`, without making assumptions about what other pages added_

### Fetching data and component lifecycle

TODO

### Routing

#### With `react-router-4`

### Custom server and routing

<p><details>
  <summary><b>Examples</b></summary>
  <ul>
    <li><a href="./examples/basic">Basic custom server</a></li>
  </ul>
</details></p>

Typically you start your next server with `next start`. It's possible, however, to start a server 100% programmatically in order to customize routes, use route patterns, etc.

When using a custom server with a server file, for example called `server.js`, make sure you update the scripts key in `package.json` to:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

This example makes `/a` resolve to `./b`;

```js
// This file doesn't go through babel or webpack transformation.
// Make sure the syntax and sources this file requires are compatible with the current node version you are running
// See https://github.com/zeit/next.js/issues/1245 for discussions on Universal Webpack or universal Babel
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true)
    const { pathname, query } = parsedUrl

    if (pathname === '/a') {
      app.render(req, res, '/b', query)
    } else {
      handle(req, res, parsedUrl)
    }
  }).listen(3000, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
```

The `next` API is as follows:
- `next(opts: object)`

Supported options:
- `dev` (`bool`) whether to launch Next.js in dev mode - default `false`
- `main` (`string`) the root component of app,  - default `src/config`
- `dir` (`string`) where the Next project is located - default `'.'`
- `quiet` (`bool`) Hide error messages containing server information - default `false`
- `conf` (`object`) the same object you would use in `next.config.js` - default `{}`

Then, change your `start` script to `NODE_ENV=production node server.js`.


#### Dynamic assetPrefix

Sometimes we need to set the `assetPrefix` dynamically. This is useful when changing the `assetPrefix` based on incoming requests.
For that, we can use `app.setAssetPrefix`.

Here's an example usage of it:

```js
const next = require('next')
const micro = require('micro')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = micro((req, res) => {
    // Add assetPrefix support based on the hostname
    if (req.headers.host === 'my-app.com') {
      app.setAssetPrefix('http://cdn.com/myapp')
    } else {
      app.setAssetPrefix('')
    }

    handleNextRequests(req, res)
  })

  server.listen(port, (err) => {
    if (err) {
      throw err
    }

    console.log(`> Ready on http://localhost:${port}`)
  })
})

```

### Dynamic Import

<p><details>
  <summary><b>Examples</b></summary>
  <ul>
    <li><a href="./examples/with-dynamic-import">With Dynamic Import</a></li>
  </ul>
</details></p>

Next.js supports TC39 [dynamic import proposal](https://github.com/tc39/proposal-dynamic-import) for JavaScript.
With that, you could import JavaScript modules (inc. React Components) dynamically and work with them.

You can think dynamic imports as another way to split your code into manageable chunks.
Since Next.js supports dynamic imports with SSR, you could do amazing things with it.

Here are a few ways to use dynamic imports.

#### 1. Basic Usage (Also does SSR)

```jsx
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(import('../components/hello'))

export default () =>
  <div>
    <Header />
    <DynamicComponent />
    <p>HOME PAGE is here!</p>
  </div>
```

#### 2. With Custom Loading Component

```jsx
import dynamic from 'next/dynamic'

const DynamicComponentWithCustomLoading = dynamic(
  import('../components/hello2'),
  {
    loading: () => <p>...</p>
  }
)

export default () =>
  <div>
    <Header />
    <DynamicComponentWithCustomLoading />
    <p>HOME PAGE is here!</p>
  </div>
```


#### 3. With Multiple Modules At Once

```jsx
import dynamic from 'next/dynamic'

const HelloBundle = dynamic({
  modules: props => {
    const components = {
      Hello1: import('../components/hello1'),
      Hello2: import('../components/hello2')
    }

    // Add remove components based on props

    return components
  },
  render: (props, { Hello1, Hello2 }) =>
    <div>
      <h1>
        {props.title}
      </h1>
      <Hello1 />
      <Hello2 />
    </div>
})

export default () => <HelloBundle title="Dynamic Bundle" />
```

### Custom `<Document>`

<p><details>
  <summary><b>Examples</b></summary>
  <ul><li><a href="./examples/with-styled-components">Styled components custom document</a></li></ul>
  <ul><li><a href="./examples/with-amp">Google AMP</a></li></ul>
</details></p>

Pages in `Next.js` skip the definition of the surrounding document's markup. For example, you never include `<html>`, `<body>`, etc. To override that default behavior, you must create a file at `./pages/_document.js`, where you can extend the `Document` class:

```jsx
// ./pages/_document.js
import Document, { Head, Main, NextScript } from 'next/document'
import flush from 'styled-jsx/server'

export default class MyDocument extends Document {
  static getInitialProps({ renderPage }) {
    const { html, head, errorHtml, chunks } = renderPage()
    const styles = flush()
    return { html, head, errorHtml, chunks, styles }
  }

  render() {
    return (
      <html>
        <Head>
          <style>{`body { margin: 0 } /* custom! */`}</style>
        </Head>
        <body className="custom_class">
          {this.props.customValue}
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
```

The `ctx` object is equivalent to the one received in all [`getInitialProps`](#fetching-data-and-component-lifecycle) hooks, with one addition:

- `renderPage` (`Function`) a callback that executes the actual React rendering logic (synchronously). It's useful to decorate this function in order to support server-rendering wrappers like Aphrodite's [`renderStatic`](https://github.com/Khan/aphrodite#server-side-rendering)

__Note: React-components outside of `<Main />` will not be initialised by the browser. If you need shared components in all your pages (like a menu or a toolbar), do _not_ add application logic  here, but take a look at [this example](https://github.com/zeit/next.js/tree/master/examples/layout-component).__

### Custom error handling

404 or 500 errors are handled both client and server side by a default component `error.js`. If you wish to override it, define a `_error.js` in the pages folder:

```jsx
import React from 'react'

export default class Error extends React.Component {
  static getInitialProps({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode }
  }

  render() {
    return (
      <p>
        {this.props.statusCode
          ? `An error ${this.props.statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
    )
  }
}
```

### Reusing the built-in error page

If you want to render the built-in error page you can by using `next/error`:

```jsx
import React from 'react'
import Error from 'next/error'
import fetch from 'isomorphic-unfetch'

export default class Page extends React.Component {
  static async getInitialProps() {
    const res = await fetch('https://api.github.com/repos/zeit/next.js')
    const statusCode = res.statusCode > 200 ? res.statusCode : false
    const json = await res.json()

    return { statusCode, stars: json.stargazers_count }
  }

  render() {
    if (this.props.statusCode) {
      return <Error statusCode={this.props.statusCode} />
    }

    return (
      <div>
        Next stars: {this.props.stars}
      </div>
    )
  }
}
```

> If you have created a custom error page you have to import your own `_error` component instead of `next/error`

### Custom configuration

For custom advanced behavior of Next.js, you can create a `next.config.js` in the root of your project directory (next to `pages/` and `package.json`).

Note: `next.config.js` is a regular Node.js module, not a JSON file. It gets used by the Next server and build phases, and not included in the browser build.

```js
// next.config.js
module.exports = {
  /* config options here */
}
```

Or use a function:

```js
module.exports = (phase, {defaultConfig}){
  // 
  // https://github.com/zeit/
  return {
    /* config options here */
  }
}
```

`phase` is the current context in which the configuration is loaded. You can see all phases here: [constants](./lib/constants.js)
Phases can be imported from `next/constants`:

```js
const {PHASE_DEVELOPMENT_SERVER} = require('next/constants')
module.exports = (phase, {defaultConfig}){
  if(phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      /* development only config options here */
    }
  }

  return {
    /* config options for all phases except development here */
  }
}
```

#### Setting a custom build directory

You can specify a name to use for a custom build directory. For example, the following config will create a `build` folder instead of a `.next` folder. If no configuration is specified then next will create a `.next` folder.

```js
// next.config.js
module.exports = {
  distDir: 'build'
}
```

#### Configuring the onDemandEntries

Next exposes some options that give you some control over how the server will dispose or keep in memories pages built:

```js
module.exports = {
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  }
}
```

This is development-only feature. If you want to cache SSR pages in production, please see [SSR-caching](https://github.com/zeit/next.js/tree/canary/examples/ssr-caching) example.

#### Configuring extensions looked for when resolving pages in `pages`

Aimed at modules like [`@zeit/next-typescript`](https://github.com/zeit/next-plugins/tree/master/packages/next-typescript), that add support for pages ending in `.ts`. `pageExtensions` allows you to configure the extensions looked for in the `pages` directory when resolving pages.

```js
// next.config.js
module.exports = {
  pageExtensions: ['jsx', 'js']
}
```

### Customizing webpack config

<p><details>
  <summary><b>Examples</b></summary>
  <ul><li><a href="./examples/with-webpack-bundle-analyzer">Custom webpack bundle analyzer</a></li></ul>
</details></p>

In order to extend our usage of `webpack`, you can define a function that extends its config via `next.config.js`.

```js
// This file is not going through babel transformation.
// So, we write it in vanilla JS
// (But you could use ES2015 features supported by your Node.js version)

module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    // Perform customizations to webpack config

    // Important: return the modified config
    return config
  },
  webpackDevMiddleware: config => {
    // Perform customizations to webpack dev middleware config

    // Important: return the modified config
    return config
  }
}
```

Some commonly asked for features are available as modules:

- [@zeit/next-css](https://github.com/zeit/next-plugins/tree/master/packages/next-css)
- [@zeit/next-sass](https://github.com/zeit/next-plugins/tree/master/packages/next-sass)
- [@zeit/next-less](https://github.com/zeit/next-plugins/tree/master/packages/next-less)

*Warning: The `webpack` function is executed twice, once for the server and once for the client. This allows you to distinguish between client and server configuration using the `isServer` property*


### Customizing babel config

<p><details>
  <summary><b>Examples</b></summary>
  <ul><li><a href="./examples/basic">Custom babel configuration</a></li></ul>
</details></p>

In order to extend our usage of `babel`, you can simply define a `.babelrc` file at the root of your app. This file is optional.

If found, we're going to consider it the *source of truth*, therefore it needs to define what next needs as well, which is the `next/babel` preset.

This is designed so that you are not surprised by modifications we could make to the babel configurations.

Here's an example `.babelrc` file:

```json
{
  "presets": ["symphony/babel"],
  "plugins": []
}
```

#### Exposing configuration to the server / client side

The `config` key allows for exposing runtime configuration in your app. All keys are server only by default. To expose a configuration to both the server and client side you can use the `public` key.

```js
// next.config.js
module.exports = {
  serverRuntimeConfig: { // Will only be available on the server side
    mySecret: 'secret'
  },
  publicRuntimeConfig: { // Will be available on both server and client
    staticFolder: '/static'
  }
}
```

```js
// pages/index.js
import getConfig from 'next/config'
const {serverRuntimeConfig, publicRuntimeConfig} = getConfig()

console.log(serverRuntimeConfig.mySecret) // Will only be available on the server side
console.log(publicRuntimeConfig.staticFolder) // Will be available on both server and client

export default () => <div>
  <img src={`${publicRuntimeConfig.staticFolder}/logo.png`} />
</div>
```

### CDN support with Asset Prefix

To set up a CDN, you can set up the `assetPrefix` setting and configure your CDN's origin to resolve to the domain that Next.js is hosted on.

```js
const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  // You may only need to add assetPrefix in the production.
  assetPrefix: isProd ? 'https://cdn.mydomain.com' : ''
}
```

Note: Next.js will automatically use that prefix in the scripts it loads, but this has no effect whatsoever on `/static`. If you want to serve those assets over the CDN, you'll have to introduce the prefix yourself. One way of introducing a prefix that works inside your components and varies by environment is documented [in this example](https://github.com/zeit/next.js/tree/master/examples/with-universal-configuration).

## Production deployment

To deploy, instead of running `next`, you want to build for production usage ahead of time. Therefore, building and starting are separate commands:

```bash
next build
next start
```

For example, to deploy with [`now`](https://zeit.co/now) a `package.json` like follows is recommended:

```json
{
  "name": "my-app",
  "dependencies": {
    "next": "latest"
  },
  "scripts": {
    "dev": "next",
    "build": "next build",
    "start": "next start"
  }
}
```

Then run `now` and enjoy!

Next.js can be deployed to other hosting solutions too. Please have a look at the ['Deployment'](https://github.com/zeit/next.js/wiki/Deployment) section of the wiki.

Note: `NODE_ENV` is properly configured by the `next` subcommands, if absent, to maximize performance. if you’re using Next.js [programmatically](#custom-server-and-routing), it’s your responsibility to set `NODE_ENV=production` manually!

Note: we recommend putting `.next`, or your custom dist folder (Please have a look at ['Custom Config'](https://github.com/zeit/next.js#custom-configuration)). You can set a custom folder in config, `.npmignore`, or `.gitignore`. Otherwise, use `files` or `now.files` to opt-into a whitelist of files you want to deploy (and obviously exclude `.next` or your custom dist folder).

## Static HTML export

TODO

## FAQ

TODO

## Contributing

Please see our [contributing.md](./contributing.md)


