import React from "react";
import Document, { Html, Head, Main, JoyScript, DocumentContext } from "@symph/joy/document";

export default class MyDocument extends Document<any> {
  static async getInitialProps(ctx: DocumentContext) {
    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = async () => {
      const { html, head } = await originalRenderPage({
        // useful for wrapping the whole react tree
        enhanceApp: (App) => App,
      });
      return { html, head };
    };

    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, customProperty: "Hello Document" };
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <p id="hello-document">Hello Document</p>
          <p id="hello-document-hmr">Hello Document HMR</p>
          <p id="custom-property">{this.props.customProperty}</p>
          <Main />
          <JoyScript />
        </body>
      </Html>
    );
  }
}
