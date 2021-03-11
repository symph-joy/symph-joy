import React from 'react'
import Document, { Head, Main, JoyScript } from '@symph/joy/document'

class QianKunHead extends Head {
  getPreloadDynamicChunks () {
    return []
  }

  getPreloadMainLinks () {
    return []
  }
}

class QianKunJoyScript extends JoyScript {
  getDynamicChunks () {
    const { dynamicImports, assetPrefix } = this.context._documentProps
    return dynamicImports.map((bundle) => {
      return (
        <script
          key={bundle.file}
          src={`${assetPrefix}/_joy/${bundle.file}`}
          nonce={this.props.nonce}
        />)
    })
  }

  getScripts () {
    const { assetPrefix, files } = this.context._documentProps
    if (!files || files.length === 0) {
      return null
    }

    return files.reverse().map((file) => {
      // Only render .js files here
      if (!/\.js$/.exec(file)) {
        return null
      }

      return (
        <script
          key={file}
          src={`${assetPrefix}/_joy/${file}`}
          nonce={this.props.nonce}
        />)
    })
  }
}

export default class MyDocument extends Document {

  render () {
    const { assetPrefix, files } = this.props
    const mainScript = files.find(file => /main[.]*\.js$/.exec(file))
    return (
      <html>
        <QianKunHead>
          {/* add custom head tags */}
        </QianKunHead>
        <body>
          <Main />
        </body>
        <QianKunJoyScript />
      </html>
    )
  }

}
