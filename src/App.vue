<template>
  <v-app>
    <v-main>
      <v-container>
        <section class="d-flex">
          <v-combobox v-model="fix" :items="items" class="mr-3 select-width" />
          <v-text-field
            v-model="content"
            @keypress.enter="send"
            @click:append="send"
            autofocus
            class="flex-grow-1"
            append-icon="mdi-arrow-left-bottom"
          />
        </section>
        <v-btn-toggle color="primary" group shaped dense>
          <v-btn v-for="v of pages" :key="v.icon" icon :to="v.to">
            <v-icon>{{ v.icon }}</v-icon>
          </v-btn>
        </v-btn-toggle>
        <keep-alive>
          <router-view />
        </keep-alive>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { SendComment } from "./plugins/axios";
import { ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
import { ChangeCookie, ChangeSelect } from "./store/mutations";

export default {
  name: "App",
  data: () => ({
    items: ["【", "【（"],
    content: "",
    fix: "",
    pages: [
      { icon: "mdi-video", to: "room" },
      { icon: "mdi-music", to: "music" },
      { icon: "mdi-account", to: "cookie" },
      { icon: "mdi-cog", to: "setting" },
      { icon: "mdi-palette", to: "theme" },
    ],
  }),
  computed: { ...mapState(["select"]) },
  created() {
    const cookie = localStorage.getItem("cookie");
    const select = localStorage.getItem("select");
    this.ChangeCookie(cookie);
    this.ChangeSelect(select);
  },
  methods: {
    ...mapMutations([ChangeCookie.name, ChangeSelect.name]),
    send() {
      if (!this.content || !this.select.length) return;
      const comment = this.fix + this.content;
      ipcRenderer.send(SendComment.name, this.select, comment);
      this.content = "";
    },
  },
};
</script>

<style scoped>
.select-width {
  max-width: 96px !important;
}
</style>
