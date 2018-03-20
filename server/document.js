import React, { Component } from 'react'
import PropTypes from 'prop-types'
import htmlescape from 'htmlescape'
import flush from 'styled-jsx/server'

const Fragment = React.Fragment || function Fragment ({ children }) {
  return <div>{children}</div>
}

export default class Document extends Component {
  static async getInitialProps ({ renderPage }) {
    const { html, head, errorHtml, chunks, initStoreState } = await renderPage()
    const styles = flush()
    return { html, head, errorHtml, chunks, styles, initStoreState }
  }

  static childContextTypes = {
    _documentProps: PropTypes.any
  }

  getChildContext () {
    return { _documentProps: this.props }
  }

  render () {
    return <html>
      <Head />
      <body>
        <Main />
        <SymphonyScript />
      </body>
    </html>
  }
}

export class Head extends Component {
  static contextTypes = {
    _documentProps: PropTypes.any
  }

  getChunkPreloadLink (filename) {
    const { __SYMPHONY_DATA__ } = this.context._documentProps
    let { assetPrefix, buildId } = __SYMPHONY_DATA__
    const hash = buildId

    return (
      <link
        key={filename}
        rel='preload'
        href={`${assetPrefix}/_symphony/${hash}/${filename}`}
        as='script'
      />
    )
  }

  getPreloadMainLinks () {
    const { dev } = this.context._documentProps
    if (dev) {
      return [
        this.getChunkPreloadLink('manifest.js'),
        this.getChunkPreloadLink('main.js')
      ]
    }

    // In the production mode, we have a single asset with all the JS content.
    return [
      this.getChunkPreloadLink('main.js')
    ]
  }

  getPreloadDynamicChunks () {
    const { chunks, __SYMPHONY_DATA__ } = this.context._documentProps
    let { assetPrefix } = __SYMPHONY_DATA__
    return chunks.filenames.map((chunk) => (
      <link
        key={chunk}
        rel='preload'
        href={`${assetPrefix}/_symphony/webpack/chunks/${chunk}`}
        as='script'
      />
    ))
  }

  render () {
    const { head, styles, __SYMPHONY_DATA__ } = this.context._documentProps
    const { page, pathname, buildId, assetPrefix } = __SYMPHONY_DATA__
    const pagePathname = getPagePathname(pathname)
    //去掉page的link，不在使用page路由，使用react-route 4 lane 2017-12-06
    return <head {...this.props}>
      {(head || []).map((h, i) => React.cloneElement(h, { key: h.key || i }))}
      {/*{page !== '/_error' && <link rel='preload' href={`${assetPrefix}/_symphony/${buildId}/page${pagePathname}`} as='script' />}*/}
      <link rel='preload' href={`${assetPrefix}/_symphony/${buildId}/page/_error.js`} as='script' />
      {this.getPreloadDynamicChunks()}
      {this.getPreloadMainLinks()}
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
    const { html, errorHtml } = this.context._documentProps
    return (
      <Fragment>
        <div id='__symphony' dangerouslySetInnerHTML={{ __html: html }} />
        <div id='__symphony-error' dangerouslySetInnerHTML={{ __html: errorHtml }} />
      </Fragment>
    )
  }
}

export class SymphonyScript extends Component {
  static propTypes = {
    nonce: PropTypes.string
  }

  static contextTypes = {
    _documentProps: PropTypes.any
  }

  getChunkScript (filename, additionalProps = {}) {
    const { __SYMPHONY_DATA__ } = this.context._documentProps
    let { assetPrefix, buildId } = __SYMPHONY_DATA__
    const hash = buildId

    return (
      <script
        key={filename}
        src={`${assetPrefix}/_symphony/${hash}/${filename}`}
        {...additionalProps}
      />
    )
  }

  getScripts () {
    const { dev } = this.context._documentProps
    if (dev) {
      return [
        this.getChunkScript('manifest.js'),
        this.getChunkScript('main.js')
      ]
    }

    // In the production mode, we have a single asset with all the JS content.
    // So, we can load the script with async
    return [this.getChunkScript('main.js', { async: true })]
  }

  getDynamicChunks () {
    const { chunks, __SYMPHONY_DATA__ } = this.context._documentProps
    let { assetPrefix } = __SYMPHONY_DATA__
    return (
      <Fragment>
        {chunks.filenames.map((chunk) => (
          <script
            async
            key={chunk}
            src={`${assetPrefix}/_symphony/webpack/chunks/${chunk}`}
          />
        ))}
      </Fragment>
    )
  }

  render () {
    const { staticMarkup, __SYMPHONY_DATA__, chunks } = this.context._documentProps
    const { page, pathname, buildId, assetPrefix } = __SYMPHONY_DATA__
    const pagePathname = getPagePathname(pathname)

    __SYMPHONY_DATA__.chunks = chunks.names

    return <Fragment>
      {staticMarkup ? null : <script nonce={this.props.nonce} dangerouslySetInnerHTML={{
        __html: `
          __SYMPHONY_DATA__ = ${htmlescape(__SYMPHONY_DATA__)}
          module={}
          __SYMPHONY_LOADED_PAGES__ = []
          __SYMPHONY_LOADED_CHUNKS__ = []

          __SYMPHONY_REGISTER_PAGE = function (route, fn) {
            __SYMPHONY_LOADED_PAGES__.push({ route: route, fn: fn })
          }

          __SYMPHONY_REGISTER_CHUNK = function (chunkName, fn) {
            __SYMPHONY_LOADED_CHUNKS__.push({ chunkName: chunkName, fn: fn })
          }

          ${page === '_error' && `
          __SYMPHONY_REGISTER_PAGE(${htmlescape(pathname)}, function() {
            var error = new Error('Page does not exist: ${htmlescape(pathname)}')
            error.statusCode = 404

            return { error: error }
          })
          `}
        `
      }} />}
      {/*{page !== '/_error' && <script async id={`__SYMPHONY_PAGE__${pathname}`} src={`${assetPrefix}/_symphony/${buildId}/page${pagePathname}`} />}*/}
      {/*<script  id={`__SYMPHONY_PAGE__index`} src={`${assetPrefix}/_symphony/${buildId}/page/index.js`} />*/}
      <script async id={`__SYMPHONY_PAGE__/_error`} src={`${assetPrefix}/_symphony/${buildId}/page/_error.js`} />
      {staticMarkup ? null : this.getDynamicChunks()}
      {staticMarkup ? null : this.getScripts()}
    </Fragment>
  }
}

function getPagePathname (pathname) {
  if (pathname === '/') {
    return '/index.js'
  }

  return `${pathname}.js`
}
