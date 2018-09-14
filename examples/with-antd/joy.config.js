const withCss = require('@symph/joy-css');
const withLess = require('@symph/joy-less');
module.exports = {
  plugins: [
    withCss({
      cssModules: false
    }),
    withLess({
      cssModules: true
    })
  ],
  publicRuntimeConfig: {
    env: process.env.NODE_ENV,
  }
};


