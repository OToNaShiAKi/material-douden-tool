<template>
  <section>
    <Pack>切换主题色</Pack>
    <v-radio-group row v-model="theme" @change="change">
      <v-radio
        v-for="item in themes"
        :key="item.value"
        :label="item.label"
        :color="item.value"
        :value="item.value"
      />
    </v-radio-group>
    <v-switch v-model="dark" @change="model" inset label="Dark" />
  </section>
</template>

<script>
import Pack from "../components/Pack.vue";

export default {
  name: "Colors",
  components: { Pack },
  data: ({ $vuetify: { theme } }) => ({
    theme: theme.currentTheme.primary,
    themes: [
      { label: "少女粉", value: "#fa7298" },
      { label: "宝石蓝", value: "#2196f3" },
      { label: "咖啡褐", value: "#5c2e2e" },
      { label: "咸蛋黄", value: "#fd8a2f" },
      { label: "夕阳红", value: "#ff5252" },
      { label: "早苗绿", value: "#8bc24a" },
      { label: "罗兰紫", value: "#9c28b1" },
    ],
    dark: theme.dark,
  }),
  methods: {
    change(value) {
      this.$vuetify.theme.themes.light.primary = value;
      this.$vuetify.theme.themes.dark.primary = value;
      localStorage.setItem("primary", value);
    },
    model(value) {
      this.$vuetify.theme.dark = value;
      localStorage.setItem("model", value);
    },
  },
};
</script>
