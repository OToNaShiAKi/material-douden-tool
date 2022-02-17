<template>
  <section>
    <v-subheader class="justify-space-between">
      <span>切换主题色</span>
      <v-btn icon @click="$router.go(-1)">
        <v-icon>mdi-chevron-up</v-icon>
      </v-btn>
    </v-subheader>
    <v-radio-group row v-model="theme" @change="change">
      <v-radio
        class="mx-3"
        v-for="item in themes"
        :key="item.value"
        :label="item.label"
        :color="item.value"
        :value="item.value"
      />
    </v-radio-group>
    <v-switch class="mx-3" @change="dark" inset label="Dark" />
  </section>
</template>

<script>
export default {
  name: "Colors",
  created() {
    this.theme = this.$vuetify.theme.currentTheme.primary;
  },
  data: () => ({
    theme: "#2196f3",
    themes: [
      { label: "少女粉", value: "#fa7298" },
      { label: "宝石蓝", value: "#2196f3" },
      { label: "咖啡褐", value: "#5c2e2e" },
      { label: "咸蛋黄", value: "#fd8a2f" },
      { label: "夕阳红", value: "#ff5252" },
      { label: "早苗绿", value: "#8bc24a" },
      { label: "罗兰紫", value: "#9c28b1" },
    ],
  }),
  methods: {
    change(value) {
      localStorage.setItem("primary", value);
      this.$vuetify.theme.themes.light.primary = value;
      this.$vuetify.theme.themes.dark.primary = value;
    },
    dark(value) {
      this.$vuetify.theme.dark = value;
    },
  },
};
</script>
