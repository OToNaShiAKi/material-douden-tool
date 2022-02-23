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
            @keypress.down="history"
            @keypress.prevent.tab="changefix"
            @keypress.up="history"
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
    fix: "",
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
      return fixes.map(({ prefix, suffix }) => prefix + " " + suffix);
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
      const [prefix = "", suffix = ""] = this.fix.split(" ");
      ipcRenderer.send(
        SendComment.name,
        this.select,
        prefix + this.content + suffix
      );
      this.content = "";
    },
    changefix() {
      let index = this.fixes.indexOf(this.fix);
      console.log(index);
      if (index === this.fixes.length - 1) index = -1;
      this.fix = this.fixes[index + 1];
    },
    history(event) {
      console.log(event);
    },
  },
};
</script>

<style>
.select-width {
  max-width: 120px !important;
}
body::-webkit-scrollbar {
  width: 0;
}
</style>
