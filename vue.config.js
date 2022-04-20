module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        publish: ["github"],
        productName: "Material DouDen Tool",
        win: {
          icon: "./public/favicon.png",
          target: ["nsis"],
        },
        mac: { icon: "./public/favicon.png" },
        nsis: {
          oneClick: false,
          allowElevation: true,
          allowToChangeInstallationDirectory: true,
          createStartMenuShortcut: true,
        },
      },
    },
  },
  pages: {
    index: "./src/pages/main/main.js",
    other: "./src/pages/other/main.js",
  },
};
