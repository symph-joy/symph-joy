import curry from "lodash.curry";
import { Configuration } from "webpack";
import { joyImageLoaderRegex } from "../../../../webpack-config";
import { loader } from "../../helpers";
import { ConfigurationContext, ConfigurationFn, pipe } from "../../utils";
import { getCustomDocumentImageError } from "./messages";

export const images = curry(async function images(_ctx: ConfigurationContext, config: Configuration) {
  const fns: ConfigurationFn[] = [
    loader({
      oneOf: [
        {
          test: joyImageLoaderRegex,
          use: {
            loader: "error-loader",
            options: {
              reason: getCustomDocumentImageError(),
            },
          },
          issuer: /pages[\\/]_document\./,
        },
      ],
    }),
  ];

  const fn = pipe(...fns);
  return fn(config);
});
