module.exports = {
  imports: [
    {
      from: "./third-module",
      mount: "/third",
      // reactModule: "./dist/client/third-react-application.configuration.js",
      // serverModule: "./dist/server/third-server-application.configuration.js",
      // dynamic: true,
    },
  ],
};
