<template>
  <section>
    <Pack>设置</Pack>
    <v-radio-group row v-model="theme" @change="change">
      <v-radio
        v-for="item of themes"
        :key="item.value"
        :label="item.label"
        :color="item.value"
        :value="item.value"
      />
      <v-switch
        class="ml-1"
        v-model="dark"
        hide-details
        @change="mode"
        inset
        label="Dark"
      />
    </v-radio-group>
    <v-switch
      v-model="AutoClickRedPocket"
      inset
      class="ml-1"
      label="自动抽红包"
      @change="setting"
    />
    <v-data-table :items-per-page="5" :items="filters" :headers="headers">
      <template v-slot:item.actions="{ index }">
        <v-icon small :data-key="index" @click="remove">mdi-delete</v-icon>
      </template>
    </v-data-table>
    <v-text-field
      @keyup.enter="add"
      @click:append="add"
      label="添加过滤弹幕"
      append-icon="mdi-arrow-left-bottom"
      hint="过滤弹幕不展示在弹幕捕获页面"
      v-model="filter"
    />
  </section>
</template>

<script>
import Pack from "../../../components/Pack.vue";
import Socket from "../../../plugins/socket";

export default {
  name: "Theme",
  components: { Pack },
  data: ({ $vuetify: { theme } }) => ({
    theme: theme.currentTheme.primary,
    themes: [
      { label: "少女", value: "#fa7298" },
      { label: "宝石", value: "#2196f3" },
      { label: "咖啡", value: "#5c2e2e" },
      { label: "咸蛋", value: "#fd8a2f" },
      { label: "夕阳", value: "#ff5252" },
      { label: "早苗", value: "#8bc24a" },
      { label: "罗兰", value: "#9c28b1" },
    ],
    dark: theme.dark,
    AutoClickRedPocket: Socket.AutoClickRedPocket,
    headers: [
      { text: "过滤弹幕", value: "filter" },
      { text: "操作", value: "actions", sortable: false },
    ],
    filters: Socket.filters.map((filter) => ({ filter })),
    filter: "",
  }),
  methods: {
    change(value) {
      this.$vuetify.theme.themes.light.primary = value;
      this.$vuetify.theme.themes.dark.primary = value;
      localStorage.setItem("primary", value);
    },
    mode(value) {
      this.$vuetify.theme.dark = value;
      localStorage.setItem("mode", value);
    },
    setting(value, key = "AutoClickRedPocket") {
      Socket[key] = value;
      localStorage.setItem(key, value);
    },
    remove({ target: { dataset } }) {
      const { key } = dataset;
      this.filters.splice(key, 1);
      Socket.filters.splice(key, 1);
      localStorage.setItem("filters", JSON.stringify(Socket.filters));
    },
    add() {
      this.filters.push({ filter: this.filter });
      Socket.filters.push(this.filter);
      this.filter = "";
      localStorage.setItem("filters", JSON.stringify(Socket.filters));
    },
  },
};
</script>
