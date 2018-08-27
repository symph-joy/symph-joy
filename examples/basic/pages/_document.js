import Document, { Head, Main, JoyScript } from '@symph/joy/document'

export default class MyDocument extends Document {
  render () {
    let {dev} = this.props;
    return (
      <html>
        <Head>
          {/* add custom style file, dev mode will use style-loader to load styles */}
          {!dev ? <link rel='stylesheet' href='/_joy/static/style.css' /> : null }
        </Head>
        <body>
          <Main />
          <JoyScript />
        </body>
      </html>
    )
  }
}
