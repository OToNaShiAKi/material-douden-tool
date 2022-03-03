module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
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
};
