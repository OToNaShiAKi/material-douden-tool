<template>
  <v-app>
    <v-main>
      <v-container>
        <section class="d-flex">
          <v-combobox :items="items" label="Fix" class="mr-3 select-width" />
          <v-text-field
            v-model="content"
            @keypress.enter="send"
            @click:append-inner="send"
            autofocus
            label="Comment"
            class="flex-grow-1"
            append-icon="mdi-arrow-left-bottom"
          />
        </section>
        <v-subheader class="justify-space-between">
          <span></span>
          <v-btn-toggle color="primary" group shaped dense>
            <v-btn icon to="theme" value="theme">
              <v-icon>mdi-palette</v-icon>
            </v-btn>
            <v-btn icon to="cookie" value="cookie">
              <v-icon>mdi-cookie</v-icon>
            </v-btn>
            <v-btn icon to="music" value="music">
              <v-icon>mdi-music</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-subheader>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { SendComment, ChangeCookie } from "./plugins/axios";
import { ipcRenderer } from "electron";

export default {
  name: "App",
  data: () => ({
    items: ["【", "【（"],
    content: "",
  }),
  created() {
    const cookie = localStorage.getItem("cookie");
    if (cookie) {
      const bili_jct = cookie.match(/bili_jct=(\w+);/);
      ipcRenderer.send(ChangeCookie, cookie, bili_jct[1]);
    }
  },
  methods: {
    send() {
      ipcRenderer.send(
        SendComment.name,
        ["10035114", "14525339"],
        this.content
      );
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
