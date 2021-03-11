import Document, { Head, Main, JoyScript } from '@symph/joy/document'

export default class MyDocument extends Document {
  render () {
    return (
      <html>
        <Head>
          {/* add custom head tags */}
        </Head>
        <body>
          <Main />
          <JoyScript />
        </body>
      </html>
    )
  }
}
