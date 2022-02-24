<template>
  <v-app>
    <v-main>
      <v-container>
        <section class="d-flex">
          <v-select v-model="fix" :items="fixes" class="mr-3 select-width" />
          <v-text-field
            v-model="content"
            @keyup.enter="send"
            @click:append="send"
            @keyup.down="history"
            @keydown.stop.prevent.tab="changefix"
            @keyup.up="history"
            autofocus
            :error-messages="message"
            class="flex-grow-1"
            append-icon="mdi-arrow-left-bottom"
            hint="上下键可循环切换已发弹幕 TAB可循环切换前后缀"
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
import { FormatComment } from "./plugins/utils";
import { mapMutations, mapState } from "vuex";
import { ChangeCookie, ChangeSelect, ChangeFixes } from "./store/mutations";

export default {
  name: "App",
  data: () => ({
    content: "",
    fix: undefined,
    pages: [
      { icon: "mdi-chat", to: "live" },
      { icon: "mdi-video", to: "room" },
      { icon: "mdi-music", to: "music" },
      { icon: "mdi-account", to: "cookie" },
      { icon: "mdi-code-brackets", to: "setting" },
      { icon: "mdi-palette", to: "theme" },
    ],
    message: "",
    record: [],
  }),
  computed: { ...mapState(["select", "fixes"]) },
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
      if (this.content.length <= 0) {
        this.message = "发送内容不可为空";
        return;
      }
      if (this.select.length <= 0) {
        this.message = "未选择发送房间";
        return;
      }
      FormatComment(this.content, this.select, this.fix);
      this.record.push(this.content);
      this.record.index = this.record.length - 1;
      this.content = "";
      this.message = "";
    },
    changefix() {
      let index = this.fixes.indexOf(this.fix);
      if (index >= this.fixes.length - 1) index = -1;
      this.fix = this.fixes[index + 1];
    },
    history(event) {
      if (event.keyCode === 40) {
        this.record.index += 1;
        if (this.record.index >= this.record.length) this.record.index = 0;
      } else if (event.keyCode === 38) {
        this.record.index -= 1;
        if (this.record.index < 0) this.record.index = this.record.length - 1;
      }
      this.content = this.record[this.record.index];
    },
  },
};
</script>

<style>
.select-width {
  max-width: 120px !important;
}
*::-webkit-scrollbar {
  width: 0;
}
</style>
