import Document, { Head, Main, JoyScript } from "@symph/joy/document";
import { themeColors, themeColorStyle } from "../utils/theme";

export default class MyDocument extends Document {
  render() {
    return (
      <html>
        <Head>
          {/* <link href="/static/antd.css" rel="stylesheet"></link> */}
          {/* add custom style */}
          <link rel="stylesheet" id="theme-style" />
          <style id="theme-color"></style>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                const theme = localStorage.getItem('theme') || 'light';
                const themeColor = localStorage.getItem('themeColor') || 'volcano';
                const themeUrl = "/static/antd.variable.css";
                const link = document.getElementById('theme-style');
                link.href = themeUrl;
                const style = document.getElementById('theme-color');
                console.log('themeColor: ', themeColor);
                const styles = ${JSON.stringify(themeColorStyle)};
                const styleColors = ${JSON.stringify(themeColors)};
                style.innerHTML = styles[themeColor];
                document.documentElement.style.setProperty('--theme-color', styleColors[themeColor]);
              `,
            }}
          />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"></script>
        </Head>
        <body>
          <Main />
          <JoyScript />
        </body>
      </html>
    );
  }
}
