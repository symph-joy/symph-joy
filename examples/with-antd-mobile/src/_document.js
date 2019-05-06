import Document, { Head, Main, JoyScript } from '@symph/joy/document'

export default class MyDocument extends Document {
  render () {
    return (
      <html>
        <Head>
          {/* add custom head tags */}
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
          <script src="https://as.alipayobjects.com/g/component/fastclick/1.0.6/fastclick.js"></script>
        </Head>
        <body>
          <Main />
          <JoyScript />
        </body>
      </html>
    )
  }
}
