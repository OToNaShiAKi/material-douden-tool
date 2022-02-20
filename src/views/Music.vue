<template>
  <section class="px-3 pb-3">
    <Pack>歌词获取</Pack>
    <v-text-field
      v-model="keyword"
      prepend-inner-icon="mdi-magnify"
      append-icon="mdi-arrow-left-bottom"
      @keypress.enter="search"
    />
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import Pack from "../components/Pack.vue";
import { GetMusic } from "../plugins/axios";

export default {
  name: "Musi",
  components: { Pack },
  data: () => ({ keyword: "" }),
  methods: {
    async search() {
      const result = await ipcRenderer.invoke(GetMusic.name, this.keyword);
      this.keyword = "";
      console.log(result);
    },
  },
};
</script>
