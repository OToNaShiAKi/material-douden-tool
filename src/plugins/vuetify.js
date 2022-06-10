import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import zhHans from "vuetify/lib/locale/zh-Hans";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";

Vue.use(Vuetify);

const primary = localStorage.getItem("primary") || "#fa7298";
const mode = localStorage.getItem("mode") == "true";

export default new Vuetify({
  lang: {
    locales: { zhHans },
    current: "zhHans",
  },
  theme: {
    dark: mode,
    themes: {
      light: { primary },
      dark: { primary },
    },
  },
});
