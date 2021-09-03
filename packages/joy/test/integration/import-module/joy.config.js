module.exports = {
  imports: [
    {
      from: "./third-module",
      reactModule: "./dist/client/third-react-application.configuration.js",
      serverModule: "./dist/server/third-server-application.configuration.js",
      routePrefix: "/third",
      dynamic: true,
    },
    // {
    //   from: "./third-module",
    //   routePrefix: '/third',
    //   dynamic:true
    // }
  ],
};
