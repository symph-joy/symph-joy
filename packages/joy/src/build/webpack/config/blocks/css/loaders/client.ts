import { RuleSetUseItem } from "webpack";
import MiniCssExtractPlugin from "../../../../plugins/mini-css-extract-plugin";

export function getClientStyleLoader({ isDevelopment, assetPrefix }: { isDevelopment: boolean; assetPrefix: string }): RuleSetUseItem {
  return isDevelopment
    ? {
        loader: require.resolve("style-loader"),
        options: {
          // By default, style-loader injects CSS into the bottom
          // of <head>. This causes ordering problems between dev
          // and prod. To fix this, we render a <noscript> tag as
          // an anchor for the styles to be placed before. These
          // styles will be applied _before_ <style jsx global>.
          insert: function (element: Node) {
            // These elements should always exist. If they do not,
            // this code should fail.
            const anchorElement = document.querySelector("#__joy_css__DO_NOT_USE__")!;
            const parentNode = anchorElement.parentNode!; // Normally <head>

            // Each style tag should be placed right before our
            // anchor. By inserting before and not after, we do not
            // need to track the last inserted element.
            parentNode.insertBefore(element, anchorElement);
          },
        },
      }
    : {
        // @ts-ignore: TODO: remove when webpack 5 is stable
        loader: MiniCssExtractPlugin.loader,
        options: { publicPath: `${assetPrefix}/_joy/`, esModule: false },
      };
}
