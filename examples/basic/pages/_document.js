import Document, {Head, Main, JoyScript} from 'symphony-joy/document'

export default class MyDocument extends Document {
  render() {
    return (
      <html>
      <Head>
        <link rel="stylesheet" href="/_symphony/static/style.css"/>
      </Head>
      <body>
      <Main/>
      <JoyScript/>
      </body>
      </html>
    )
  }
}
