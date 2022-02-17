<template>
  <v-app>
    <v-main>
      <v-container>
        <section class="d-flex">
          <v-combobox :items="items" label="Fix" class="mr-3 select-width" />
          <v-text-field
            v-model="content"
            @keypress.enter="send"
            autofocus
            label="Text"
            class="flex-grow-1"
            append-icon="mdi-arrow-left-bottom"
          />
        </section>
        <v-subheader class="justify-space-between">
          <span></span>
          <v-btn icon to="theme">
            <v-icon>mdi-palette</v-icon>
          </v-btn>
        </v-subheader>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "App",
  data: () => ({
    items: ["【", "【（"],
    content: "",
  }),
  methods: {
    send() {
      ipcRenderer.send("SendContent", ["10035114", "14525229"], this.content);
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
