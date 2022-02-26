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
            @keyup.ctrl="phrase"
            @keyup.alt="phrase"
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
import { clipboard } from "electron";

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
      { icon: "mdi-account", to: "cookie" },
      { icon: "mdi-palette", to: "theme" },
    ],
    message: "",
    record: [],
  }),
  computed: {
    ...mapState(["select", "shortcuts"]),
    fixes() {
      const all = this.$store.state.fixes;
      return all.filter((v) => v.scope !== "歌曲");
    },
  },
  created() {
    const cookie =
      "_uuid=41A9FF710-C2F9-7394-E523-AC5DD106A746359284infoc; buvid3=270E286A-D309-4AE0-AF8F-6B72A049D6A7148830infoc; b_nut=1640247859; fingerprint=ec2e9ff620eb185ed4a6ec7034bd9c3a; buvid_fp_plain=270E286A-D309-4AE0-AF8F-6B72A049D6A7148830infoc; SESSDATA=85a5a9d8%2C1656407117%2C63138%2Ac1; bili_jct=996cb2df77454c1fdb3aa4b5fb81dd16; DedeUserID=13616635; DedeUserID__ckMd5=1f0d2bc0302cef8c; sid=bp4kwnkd; i-wanna-go-back=-1; b_ut=5; LIVE_BUVID=AUTO8216409251777581; blackside_state=1; rpdid=0zbfvWnvKo|By3BoP|4FaEJ|3w1N39D8; buvid4=43F82966-86C6-DE85-9B9F-098B982ED81E13608-022012418-1/zpuP3LHi8lZiPHkSza41KvHO6Co9wVk3IJM34pyUi5Nip99Gw7lA%3D%3D; buvid_fp=2b766a68e92128e7dac9787df3efea75; CURRENT_QUALITY=80; Hm_lvt_8a6e55dbd2870f0f5bc9194cddf32a02=1643173209,1643340413,1644389675; CURRENT_BLACKGAP=1; CURRENT_FNVAL=80; innersign=0; b_lsid=D93104F65_17F0A7F2B7B; bp_video_offset_13616635=628373128666340200; bp_t_offset_13616635=628395148959547430; _dfcaptcha=14d8cc6d0b27efc9781f603a0da16252; PVID=1";
    const select = "10035114";
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
    phrase(event) {
      let key = "";
      if (event.ctrlKey) key += "Ctrl+";
      else if (event.altKey) key += "Alt+";
      else return;
      key += event.key;
      let phrase = this.shortcuts[key];
      if (phrase) {
        phrase = phrase
          .replace(/\{c\}/gi, this.content)
          .replace(/\{v\}/gi, clipboard.readText())
          .replace(/\{s\}/gi, this.song.name)
          .replace(/\{a\}/gi, this.song.singer)
          .replace(/\{l\}/gi, this.song.lyric[this.song.stamp].tlyric);
        FormatComment(phrase, this.select, this.fix);
      }
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
.v-input--radio-group__input {
  justify-content: space-between;
}
</style>
