<template>
  <section>
    <Pack>设置</Pack>
    <section class="setting d-flex justify-space-between flex-wrap">
      <v-radio-group
        hide-details
        dense
        mandatory
        v-model="theme"
        @change="ChangeColor"
      >
        <v-radio
          v-for="item of themes"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </v-radio-group>
      <v-divider vertical class="my-3" />
      <v-item-group multiple @change="ChangeSetting" :value="config">
        <v-item
          v-for="v of auto"
          :key="v.key"
          v-slot="{ toggle }"
          :value="v.key"
        >
          <v-checkbox
            v-model="config"
            dense
            :value="v.key"
            :label="v.text"
            @change="toggle"
            :hint="v.hint"
            persistent-hint
          />
        </v-item>
      </v-item-group>
    </section>
  </section>
</template>

<script>
import Socket from "../../../plugins/socket";
import Pack from "../../../components/Pack.vue";
import { ipcRenderer } from "electron";
import { mapMutations } from "vuex";
import { Keys } from "../../../util/Format";

export default {
  name: "Setting",
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
    auto: Keys,
    config: Keys.filter((v) => Socket[v.key]).map((v) => v.key),
  }),
  methods: {
    ...mapMutations(["ChangeConfig"]),
    ChangeColor(value) {
      this.$vuetify.theme.themes.light.primary = value;
      this.$vuetify.theme.themes.dark.primary = value;
      ipcRenderer.send("Channel", "WindowStyle", value);
      localStorage.setItem("primary", value);
    },
    async ChangeSetting(config) {
      for (const item of Keys) {
        const value = config.includes(item.key);
        Socket[item.key] = value;
        localStorage.setItem(item.key, value);
      }
      const result = await ipcRenderer.invoke(
        "SubShield",
        config.includes(Keys[3])
      );
      const shields = JSON.parse(localStorage.getItem("shields")) || [];
      for (const v of shields) {
        const find = result.find((item) => item.shield === v.shield);
        if (!find) result.push(v);
      }
      this.ChangeConfig({ key: "shields", config: result });
    },
  },
};
</script>

<style>
.setting .v-input--radio-group,
.setting .v-item-group {
  width: 45%;
  padding: 12px;
  margin: 0;
  border-radius: 8px;
}
</style>
