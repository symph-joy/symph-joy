// import MiniCssExtractPlugin from './mini-css-extract-plugin/src'
// const MiniCssExtractPlugin = require("./mini-css-extract-plugin/src").default;
// @ts-ignore: TODO: remove when webpack 5 is stable
import MiniCssExtractPlugin from "mini-css-extract-plugin";

export default class JoyMiniCssExtractPlugin extends MiniCssExtractPlugin {
  __joy_css_remove = true;
}
