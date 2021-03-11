import Document, { Head, Main, JoyScript } from '@symph/joy/document'

export default class MyDocument extends Document {
  render () {
    return (
      <html>
        <Head>
          {/* add custom head tags */}
          <meta name='custom head' content='' />
        </Head>
        <body>
          <div>custom body</div>
          <Main />
          <JoyScript />
        </body>
      </html>
    )
  }
}
