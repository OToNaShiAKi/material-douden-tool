module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        productName: "Material DouDen Tool",
        win: { icon: "./public/favicon.png" },
        mac: { icon: "./public/favicon.png" },
      },
    },
  },
};
