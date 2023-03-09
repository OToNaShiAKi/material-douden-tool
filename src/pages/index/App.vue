<template>
  <v-app>
    <v-system-bar app fixed height="30" />
    <v-main>
      <v-container>
        <v-text-field
          class="fix-input input-avatar"
          v-model.trim="content"
          @keyup.enter="Send"
          @click:append="Send"
          @keyup.alt.down="History"
          @keydown.stop.prevent.tab="ChangeFix"
          @keyup.alt.up="History"
          @keyup.ctrl="Phrase"
          @keyup.alt="Phrase"
          autofocus
          solo
          :error-messages="message"
          append-icon="mdi-arrow-left-bottom"
          hint="Alt+上下键切换已发弹幕 TAB可循环切换前后缀"
        >
          <template v-slot:prepend>
            <HonourAvatar />
          </template>
          <template v-slot:prepend-inner>
            <v-select
              return-object
              dense
              solo
              hide-details
              v-model="fix"
              :items="fixes"
            />
          </template>
          <template v-slot:append-outer>
            <v-btn
              :disabled="recognition"
              color="primary"
              @click="Speech"
              icon
              style="margin-top: 6px"
            >
              <v-icon>mdi-microphone</v-icon>
            </v-btn>
          </template>
        </v-text-field>
        <section class="link-tab d-flex justify-space-between align-center">
          <v-btn-toggle color="primary" rounded group dense>
            <v-btn v-for="v of pages" small :key="v.icon" icon :to="v.to">
              <v-icon small>{{ v.icon }}</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn color="primary" icon @click="Open">
            <v-icon small>mdi-seed</v-icon>
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
        text
        bottom
        :timeout="2400"
      >
        {{ snackbar.text }}
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script>
import { clipboard, ipcRenderer, shell } from "electron";
import { SendComment } from "../../util/SendComment";
import { mapMutations, mapState } from "vuex";
import Socket from "../../plugins/socket";
import HonourAvatar from "../../components/HonourAvatar.vue";

const CommentRecord = [];

export default {
  name: "App",
  components: { HonourAvatar },
  data: ({ $store: { state } }) => ({
    recognition: false,
    content: "",
    message: "",
    fix: state.fixes.find(
      ({ prefix, scope }) => prefix === "【" && scope !== "歌曲"
    ),
    pages: [
      { icon: "mdi-chat", to: "live" },
      { icon: "mdi-home", to: "room" },
      { icon: "mdi-music-clef-treble", to: "music" },
      { icon: "mdi-flash", to: "shortcut" },
      { icon: "mdi-code-brackets", to: "bracket" },
      { icon: "mdi-account", to: "cookie" },
      { icon: "mdi-shield-remove", to: "shield" },
      { icon: "mdi-cog", to: "setting" },
    ],
  }),
  computed: {
    ...mapState([
      "select",
      "shortcuts",
      "snackbar",
      "shields",
      "song",
      "stamp",
    ]),
    fixes: ({ $store: { state } }) =>
      state.fixes.filter((v) => v.scope !== "歌曲"),
  },
  created() {
    const cookie = localStorage.getItem("cookie");
    this.ChangeCookie(cookie);
    ipcRenderer.on("CookieOverdue", () => {
      this.$router.push("/cookie");
      this.ChangeCookie("");
      this.Notify("当前Cookie已过期");
    });
    ipcRenderer.on("Forbidden", (event, roomid, info) => {
      let message = `${roomid}：${info} 被屏蔽`;
      const regexp = new RegExp(`${this.fix.prefix}|${this.fix.suffix}`, "ig");
      info = info.replace(regexp, "");
      if (Socket.AutoCopyForbidWord) {
        clipboard.writeText(info);
        message += " 已自动复制";
      }
      this.message = message;
    });
    ipcRenderer.on(
      "SpeechRecognition",
      (event, message) => (this.content += message)
    );
    ipcRenderer.on(
      "SpeechConnect",
      (event, connect) => (this.recognition = connect)
    );
    if (!cookie) {
      this.$router.push("/cookie");
    } else if (this.select.length <= 0) {
      this.$router.push("/room");
    } else {
      this.$router.push("/live");
      this.Open();
    }
  },
  methods: {
    ...mapMutations(["ChangeCookie", "Notify"]),
    Send() {
      this.message = SendComment(
        this.content,
        this.select,
        this.fix,
        this.shields
      );
      CommentRecord.push(this.content);
      CommentRecord.index = CommentRecord.length;
      this.content = "";
    },
    ChangeFix() {
      let index = this.fixes.indexOf(this.fix);
      if (index >= this.fixes.length - 1) index = -1;
      this.fix = this.fixes[index + 1];
    },
    History(event) {
      if (event.keyCode === 40) {
        CommentRecord.index +=
          CommentRecord.index >= CommentRecord.length ? 0 : 1;
      } else if (event.keyCode === 38) {
        CommentRecord.index -= CommentRecord.index <= 0 ? 0 : 1;
      }
      this.content = CommentRecord[CommentRecord.index] || this.content;
    },
    Phrase(event) {
      let key = "";
      if (event.ctrlKey) key += "Ctrl+";
      else if (event.altKey) key += "Alt+";
      else return;
      key += event.key;
      let phrase = this.shortcuts[key];
      if (phrase) {
        const lyric = this.song.stamps[this.stamp];
        phrase = phrase
          .replace(/\{c\}/gi, this.content)
          .replace(/\{v\}/gi, clipboard.readText())
          .replace(/\{s\}/gi, this.song.name)
          .replace(/\{a\}/gi, this.song.singer)
          .replace(/\{l\}/gi, lyric.tlyric || lyric.lyric);
        SendComment(phrase, this.select, this.fix, this.shields);
      } else if (event.altKey && event.keyCode === 80) {
        ipcRenderer.send("Channel", "Point");
      }
    },
    Open() {
      ipcRenderer.send("OtherWindow", "support");
    },
    Speech() {
      this.recognition = true;
      shell.openExternal("http://localhost:9669/");
    },
  },
};
</script>

<style>
.relative {
  position: relative;
}
#app .v-system-bar {
  -webkit-app-region: drag;
  -webkit-user-drag: none;
  border-radius: 8px !important;
  color: #8d7ca6;
}
</style>
