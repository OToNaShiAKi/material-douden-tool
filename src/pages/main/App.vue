<template>
  <v-app>
    <v-main>
      <v-container>
        <section class="d-flex">
          <v-select
            return-object
            v-model="fix"
            :items="fixes"
            class="mr-3 select-width"
          />
          <v-text-field
            v-model.trim="content"
            @keyup.enter="send"
            @click:append="send"
            @keyup.down="history"
            @keydown.stop.prevent.tab="changefix"
            @keyup.up="history"
            @keyup.ctrl="phrase"
            @keyup.alt="phrase"
            autofocus
            :error-messages="message"
            class="flex-grow-1"
            append-icon="mdi-arrow-left-bottom"
            hint="上下键可循环切换已发弹幕 TAB可循环切换前后缀"
          />
        </section>
        <section class="d-flex justify-space-between align-center">
          <v-btn-toggle color="primary" group shaped dense>
            <v-btn v-for="v of pages" :key="v.icon" icon :to="v.to">
              <v-icon>{{ v.icon }}</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn icon @click="open">
            <v-icon>mdi-seed</v-icon>
          </v-btn>
        </section>
        <keep-alive>
          <router-view id="router" />
        </keep-alive>
      </v-container>
      <v-snackbar
        v-model="snackbar.value"
        color="primary"
        app
        shaped
        outlined
        :timeout="1000"
      >
        {{ snackbar.text }}
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script>
import { clipboard, ipcRenderer } from "electron";
import { FormatComment } from "../../plugins/utils";
import { mapMutations, mapState } from "vuex";

export default {
  name: "App",
  data: () => ({
    content: "",
    fix: undefined,
    pages: [
      { icon: "mdi-chat", to: "live" },
      { icon: "mdi-video", to: "room" },
      { icon: "mdi-music", to: "music" },
      { icon: "mdi-flash", to: "shortcut" },
      { icon: "mdi-code-brackets", to: "bracket" },
      { icon: "mdi-cookie", to: "cookie" },
      { icon: "mdi-shield-remove", to: "shield" },
      { icon: "mdi-palette", to: "theme" },
    ],
    message: "",
    record: [],
  }),
  computed: {
    ...mapState([
      "select",
      "shortcuts",
      "snackbar",
      "shields",
      "stamp",
      "song",
    ]),
    fixes() {
      const all = this.$store.state.fixes;
      return all.filter((v) => v.scope !== "歌曲");
    },
  },
  created() {
    const cookie = localStorage.getItem("cookie");
    this.ChangeCookie(cookie);
    ipcRenderer.on("CookieOverdue", () => {
      this.$router.push("/cookie");
      this.ChangeCookie("");
      this.Notify("当前Cookie已过期");
    });
    if (!cookie) this.$router.push("/cookie");
    else if (this.select.length <= 0) this.$router.push("/room");
    else this.$router.push("/live");
  },
  methods: {
    ...mapMutations(["ChangeCookie", "Notify"]),
    send() {
      this.message = FormatComment(
        this.content,
        this.select,
        this.fix,
        this.shields
      );
      this.record.push(this.content);
      this.record.index = this.record.length;
      this.content = "";
    },
    changefix() {
      let index = this.fixes.indexOf(this.fix);
      if (index >= this.fixes.length - 1) index = -1;
      this.fix = this.fixes[index + 1];
    },
    history(event) {
      if (event.keyCode === 40) {
        this.record.index += this.record.index >= this.record.length ? 0 : 1;
      } else if (event.keyCode === 38) {
        this.record.index -= this.record.index <= 0 ? 0 : 1;
      }
      this.content = this.record[this.record.index] || "";
    },
    phrase(event) {
      let key = "";
      if (event.ctrlKey) key += "Ctrl+";
      else if (event.altKey) key += "Alt+";
      else return;
      key += event.key;
      let phrase = this.shortcuts[key];
      if (phrase) {
        const lyric = this.song.stamp[this.stamp];
        phrase = phrase
          .replace(/\{c\}/gi, this.content)
          .replace(/\{v\}/gi, clipboard.readText())
          .replace(/\{s\}/gi, this.song.name)
          .replace(/\{a\}/gi, this.song.singer)
          .replace(/\{l\}/gi, lyric.tlyric || lyric.lyric);
        FormatComment(phrase, this.select, this.fix, this.shields);
      }
    },
    open() {
      ipcRenderer.send("OtherWindow", "other");
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
.center .v-input--radio-group__input {
  justify-content: center;
}
#lyric-selected {
  height: 256px;
  overflow: auto;
}
.relative {
  position: relative;
}
.relative .jump {
  top: 50%;
  transform: translateY(-50%);
  left: 14px;
}
#danmu {
  height: 360px;
  overflow: auto;
}
</style>
