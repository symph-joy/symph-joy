import Document, { Head, Main, JoyScript } from "@symph/joy/document";

export default class MyDocument extends Document {
  render() {
    return (
      <html>
        <Head>
          <link href="/static/antd.css" rel="stylesheet"></link>
          {/* add custom style */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                const theme = localStorage.getItem('theme') || 'light'
                const themeUrl = theme === "dark" ? "/static/antd.dark.css" : "/static/antd.css";
                const link = document.createElement('link')
                link.id = 'theme-style'
                link.rel = 'stylesheet'
                link.href = themeUrl
                document.head.appendChild(link)
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <JoyScript />
        </body>
      </html>
    );
  }
}
