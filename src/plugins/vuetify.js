import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import zhHans from 'vuetify/lib/locale/zh-Hans';

Vue.use(Vuetify);

const primary = localStorage.getItem("primary") || "#fa7298";

export default new Vuetify({
    lang: {
      locales: { zhHans },
      current: 'zhHans',
    },
    theme: {
      options: { customProperties: true },
      dark: false,
      themes: {
        light: { primary },
        dark: { primary },
      },
    },
});
