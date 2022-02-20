import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import zhHans from "vuetify/lib/locale/zh-Hans";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";

Vue.use(Vuetify);

const primary = localStorage.getItem("primary") || "#f27298";
const model = localStorage.getItem("model") || false;

export default new Vuetify({
  lang: {
    locales: { zhHans },
    current: "zhHans",
  },
  theme: {
    dark: model,
    themes: {
      light: { primary },
      dark: { primary },
    },
  },
});
