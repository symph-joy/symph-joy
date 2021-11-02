module.exports = {
  exportPathMap: (defaultPathMap, { dev, dir, outDir, distDir, buildId }) => {
    return {
      ...defaultPathMap,
      "/hello": { page: "/hello" },
    };
  },
};
