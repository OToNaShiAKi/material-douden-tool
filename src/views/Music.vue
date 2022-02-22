<template>
  <section>
    <Pack>歌词获取</Pack>
    <v-text-field
      v-model="keyword"
      prepend-inner-icon="mdi-magnify"
      append-icon="mdi-arrow-left-bottom"
      @keypress.enter="search"
      label="关键词"
    />
    <v-data-table
      :loading="loading"
      :items-per-page="5"
      :headers="headers"
      :items="musics"
      @click:row="select"
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
  data: () => ({
    keyword: "",
    headers: [
      { text: "歌名", value: "name" },
      { text: "歌手", value: "singer" },
      { text: "语言", value: "language" },
      { text: "来源", value: "origin" },
    ],
    musics: [],
    loading: false,
  }),
  methods: {
    async search() {
      this.loading = true;
      const result = await ipcRenderer.invoke(GetMusic.name, this.keyword);
      this.keyword = "";
      this.musics = result;
      this.loading = false;
    },
    async select(item) {
      console.log(item);
    },
  },
};
</script>
