import Document, {Head, Main, SymphonyScript} from 'symphony/document'

export default class MyDocument extends Document {
  render() {
    return (
      <html>
      <Head>
        <link rel="stylesheet" href="/_symphony/static/style.css"/>
      </Head>
      <body>
      <Main/>
      <SymphonyScript/>
      </body>
      </html>
    )
  }
}
