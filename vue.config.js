const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
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
          deleteAppDataOnUninstall: true,
        },
      },
    },
  },
  pages: {
    index: "./src/pages/index/main.js",
    support: "./src/pages/support/main.js",
  },
});
