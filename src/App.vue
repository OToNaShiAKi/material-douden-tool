<template>
  <v-app>
    <v-main>
      <v-container>
        <section class="d-flex">
          <v-combobox v-model="fix" :items="fixes" class="mr-3 select-width" />
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
import { ChangeCookie, ChangeSelect, ChangeFixes } from "./store/mutations";

export default {
  name: "App",
  data: () => ({
    content: "",
    fix: null,
    pages: [
      { icon: "mdi-chat", to: "live" },
      { icon: "mdi-video", to: "room" },
      { icon: "mdi-music", to: "music" },
      { icon: "mdi-account", to: "cookie" },
      { icon: "mdi-cog", to: "setting" },
      { icon: "mdi-palette", to: "theme" },
    ],
  }),
  computed: {
    ...mapState(["select"]),
    fixes() {
      const fixes = this.$store.state.fixes;
      return fixes.map((value) => ({
        text: value.prefix + value.suffix,
        value,
      }));
    },
  },
  created() {
    const cookie = localStorage.getItem("cookie");
    const select = localStorage.getItem("select");
    const fixes = JSON.parse(localStorage.getItem("fixes"));
    this.ChangeCookie(cookie);
    this.ChangeSelect(select);
    this.ChangeFixes(fixes || []);
    if (cookie && select) this.$router.push("/live");
    else if (cookie && !select) this.$router.push("/room");
    else if (!cookie) this.$router.push("/cookie");
  },
  methods: {
    ...mapMutations([ChangeCookie.name, ChangeSelect.name, ChangeFixes.name]),
    send() {
      if (!this.content || !this.select.length) return;
      const comment = this.fix.prefix + this.content + this.fix.suffix;
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
