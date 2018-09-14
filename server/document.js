import React, { Component } from 'react'
import PropTypes from 'prop-types'
import htmlescape from 'htmlescape'
import flush from 'styled-jsx/server'

const Fragment = React.Fragment || function Fragment ({ children }) {
  return <div>{children}</div>
}

export default class Document extends Component {
  static childContextTypes = {
    _documentProps: PropTypes.any
  }

  static async getInitialProps ({ renderPage }) {
    const { html, head, buildManifest, initStoreState } = await renderPage()
    const styles = flush()
    return { html, head, styles, buildManifest, initStoreState }
  }

  getChildContext () {
    return { _documentProps: this.props }
  }

  render () {
    return <html>
      <Head />
      <body>
        <Main />
        <JoyScript />
      </body>
    </html>
  }
}

export class Head extends Component {
  static contextTypes = {
    _documentProps: PropTypes.any
  }

  static propTypes = {
    nonce: PropTypes.string
  }

  getCssLinks () {
    const { assetPrefix, files } = this.context._documentProps
    if (!files || files.length === 0) {
      return null
    }

    return files.map((file) => {
      // Only render .css files here
      if (!/\.css$/.exec(file)) {
        return null
      }

      return <link
        key={file}
        nonce={this.props.nonce}
        rel='stylesheet'
        href={`${assetPrefix}/_joy/${file}`}
      />
    })
  }

  getPreloadDynamicChunks () {
    const { dynamicImports, assetPrefix } = this.context._documentProps
    return dynamicImports.map((bundle) => {
      return <link
        rel='preload'
        key={bundle.file}
        href={`${assetPrefix}/_joy/${bundle.file}`}
        as='script'
      />

      // return <script
      //   async
      //   key={bundle.file}
      //   src={`${assetPrefix}/_joy/${bundle.file}`}
      //   as='script'
      //   nonce={this.props.nonce}
      // />
    })
  }

  getPreloadMainLinks () {
    const { assetPrefix, files } = this.context._documentProps
    if (!files || files.length === 0) {
      return null
    }

    return files.map((file) => {
      // Only render .js files here
      if (!/\.js$/.exec(file)) {
        return null
      }

      return <link
        key={file}
        nonce={this.props.nonce}
        rel='preload'
        href={`${assetPrefix}/_joy/${file}`}
        as='script'
      />
    })
  }

  render () {
    const { head, styles } = this.context._documentProps
    // const { buildId } = __JOY_DATA__
    // const pagePathname = getPagePathname(pathname)

    return <head {...this.props}>
      {(head || []).map((h, i) => React.cloneElement(h, { key: h.key || i }))}
      {/* {page !== '/_error' && <link rel='preload' href={`${assetPrefix}/_joy/static/${buildId}/pages${pagePathname}`} as='script' nonce={this.props.nonce} />} */}
      {/* <link rel='preload' href={`${assetPrefix}/_joy/static/${buildId}/pages/_app.js`} as='script' nonce={this.props.nonce} /> */}
      {/* <link rel='preload' href={`${assetPrefix}/_joy/static/${buildId}/pages/_error.js`} as='script' nonce={this.props.nonce} /> */}
      {this.getPreloadDynamicChunks()}
      {this.getPreloadMainLinks()}
      {this.getCssLinks()}
      {styles || null}
      {this.props.children}
    </head>
  }
}

export class Main extends Component {
  static contextTypes = {
    _documentProps: PropTypes.any
  }

  render () {
    const { html } = this.context._documentProps
    return (
      <Fragment>
        <div id='__joy' dangerouslySetInnerHTML={{ __html: html }} />
      </Fragment>
    )
  }
}

export class JoyScript extends Component {
  static contextTypes = {
    _documentProps: PropTypes.any
  }

  static propTypes = {
    nonce: PropTypes.string
  }

  getDynamicChunks () {
    const { dynamicImports, assetPrefix } = this.context._documentProps
    return dynamicImports.map((bundle) => {
      return <script
        async
        key={bundle.file}
        src={`${assetPrefix}/_joy/${bundle.file}`}
        nonce={this.props.nonce}
      />
    })
  }

  getScripts () {
    const { assetPrefix, files } = this.context._documentProps
    if (!files || files.length === 0) {
      return null
    }

    return files.map((file) => {
      // Only render .js files here
      if (!/\.js$/.exec(file)) {
        return null
      }

      return <script
        key={file}
        src={`${assetPrefix}/_joy/${file}`}
        nonce={this.props.nonce}
        async
      />
    })
  }

  static getInlineScriptSource (documentProps) {
    const { __JOY_DATA__ } = documentProps
    const { page, pathname } = __JOY_DATA__

    return `
      __JOY_DATA__ = ${htmlescape(__JOY_DATA__)}
      __JOY_LOADED_PAGES__ = []

      __JOY_REGISTER_PAGE = function (route, fn) {
        __JOY_LOADED_PAGES__.push({ route: route, fn: fn })
      }${page === '_error' ? `

      __JOY_REGISTER_PAGE(${htmlescape(pathname)}, function() {
        var error = new Error('Page does not exist: ${htmlescape(pathname)}')
        error.statusCode = 404

        return { error: error }
      })` : ''}
    `
  }

  render () {
    const { staticMarkup, assetPrefix, devFiles } = this.context._documentProps
    // const { buildId } = __JOY_DATA__
    // const pagePathname = getPagePathname(pathname)

    return <Fragment>
      {devFiles ? devFiles.map((file) => <script key={file} src={`${assetPrefix}/_joy/${file}`} nonce={this.props.nonce} />) : null}
      {staticMarkup ? null : <script nonce={this.props.nonce} dangerouslySetInnerHTML={{
        __html: JoyScript.getInlineScriptSource(this.context._documentProps)
      }} />}
      {/* {page !== '/_error' && <script async id={`__JOY_PAGE__${pathname}`} src={`${assetPrefix}/_joy/static/${buildId}/pages${pagePathname}`} nonce={this.props.nonce} />} */}
      {/* <script async id={`__JOY_PAGE__/_app`} src={`${assetPrefix}/_joy/static/${buildId}/pages/_app.js`} nonce={this.props.nonce} /> */}
      {/* <script async id={`__JOY_PAGE__/_error`} src={`${assetPrefix}/_joy/static/${buildId}/pages/_error.js`} nonce={this.props.nonce} /> */}
      {staticMarkup ? null : this.getDynamicChunks()}
      {staticMarkup ? null : this.getScripts()}
    </Fragment>
  }
}

// function getPagePathname (pathname) {
//   if (pathname === '/') {
//     return '/index.js'
//   }
//
//   return `${pathname}.js`
// }
