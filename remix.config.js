/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: "server/build",
  devServerPort: 8002,
  ignoredRouteFiles: [".*"],
//   serverDependenciesToBundle: ["react-force-graph-2d", "force-graph", /^d3-/, "internmap"],
};
