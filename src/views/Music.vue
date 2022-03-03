<template>
  <section>
    <Pack>歌词获取</Pack>
    <section class="d-flex">
      <v-select
        return-object
        class="select-width mr-3"
        v-model="fix"
        :items="fixes"
      />
      <v-text-field
        v-model="keyword"
        prepend-inner-icon="mdi-magnify"
        append-icon="mdi-arrow-left-bottom"
        @keypress.enter="search"
        @click:append="search"
        label="关键词"
        hint="自动过滤无词无轴"
        :error-messages="message"
      />
    </section>
    <v-tabs-items v-model="tab">
      <v-tab-item value="table">
        <v-data-table
          :loading="loading"
          :items-per-page="5"
          :headers="headers"
          :items="musics"
          @click:row="choose"
        />
      </v-tab-item>
      <v-tab-item value="lyric">
        <section class="d-flex justify-center align-center">
          <v-btn text small @click="copy">复制此句</v-btn>
          <v-btn text small @click="track">-0.5s</v-btn>
          <v-btn
            fab
            small
            class="mx-3"
            depressed
            @click="play"
            :color="active ? 'primary' : 'secondary'"
          >
            <v-icon>{{ active ? "mdi-pause" : "mdi-play" }}</v-icon>
          </v-btn>
          <v-btn text small @click="track">+0.5s</v-btn>
          <v-btn text small @click="next">发送下句</v-btn>
        </section>
        <v-radio-group v-model="language" class="center" row>
          <v-radio v-for="v of languages" :label="v" :value="v" :key="v" />
        </v-radio-group>
        <v-hover v-slot="{ hover }">
          <section class="relative">
            <v-btn
              v-show="hover"
              color="primary"
              absolute
              icon
              small
              class="jump"
              @click="jump"
            >
              <v-icon>mdi-play</v-icon>
            </v-btn>
            <section id="lyric-selected" ref="lyric">
              <p
                class="text-center"
                :class="i === stamp && 'primary--text'"
                v-for="(v, i) of lyric"
                :key="v.stamp"
              >
                <span class="text-body-1">{{ v.lyric }}</span>
                <br />
                <span class="text-body-2">{{ v.tlyric }}</span>
              </p>
            </section>
          </section>
        </v-hover>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
import Pack from "../components/Pack.vue";
import { GetMusic } from "../plugins/axios";
import { mapMutations, mapState } from "vuex";
import { clipboard, ipcRenderer } from "electron";
import { FormatComment } from "../plugins/utils";
import { ChangeSong, Notify } from "../store/mutations";

export default {
  name: "Music",
  components: { Pack },
  data: () => ({
    keyword: "",
    headers: [
      { text: "歌名", value: "name" },
      { text: "歌手", value: "singer" },
      { text: "语言", value: "language" },
    ],
    musics: [],
    loading: false,
    tab: "table",
    active: false,
    fix: "",
    message: "",
    language: "",
  }),
  computed: {
    ...mapState(["select", "shields", "stamp"]),
    fixes() {
      const all = this.$store.state.fixes;
      return all.filter((v) => v.scope !== "同传");
    },
    lyric() {
      const { stamp = [] } = this.$store.state.song || {};
      return stamp;
    },
    languages() {
      const result = ["原文"];
      if (this.lyric[0] && this.lyric[0].tlyric) result.push("翻译", "双语");
      return result;
    },
  },
  methods: {
    ...mapMutations([Notify.name, ChangeSong.name]),
    async search() {
      if (this.keyword.length <= 0) {
        this.message = "关键词不可为空";
        return;
      }
      this.loading = true;
      this.tab = "table";
      this.message = "";
      const result = await ipcRenderer.invoke(GetMusic.name, this.keyword);
      this.keyword = "";
      this.musics = result;
      this.loading = false;
    },
    async choose(item) {
      clearTimeout(this.send.timer);
      this.tab = "lyric";
      this.send.timer = null;
      this.ChangeSong({ song: item, stamp: -1 });
      this.active = false;
    },
    play() {
      this.active = !this.active;
      if (this.active) this.send(this.lyric.slice(this.stamp + 1));
      else clearTimeout(this.send.timer);
    },
    send(lyric) {
      this.active = true;
      this.language = this.language || this.languages[1] || this.languages[0];
      if (/翻译|双语/.test(this.language) && lyric[0].tlyric)
        FormatComment(lyric[0].tlyric, this.select, this.fix, this.shields);
      if (/原文|双语/.test(this.language) && lyric[0].lyric)
        FormatComment(lyric[0].lyric, this.select, this.fix, this.shields);
      this.ChangeSong({ stamp: this.stamp + 1 });
      this.send.stamp = Date.now();
      const target = this.$refs.lyric;
      const height = target.children[0].clientHeight + 16;
      this.$vuetify.goTo(this.stamp * height, {
        container: target,
        offset: 128 - height,
        easing: "easeInOutCubic",
      });
      if (lyric.length <= 1) {
        this.send.timer = null;
        this.active = false;
        this.ChangeSong({ stamp: -1 });
        return;
      }
      this.send.timer = setTimeout(() => {
        clearTimeout(this.send.timer);
        this.send(lyric.slice(1));
      }, lyric[1].stamp - lyric[0].stamp);
    },
    next() {
      clearTimeout(this.send.timer);
      this.send(this.lyric.slice(this.stamp + 1));
    },
    jump() {
      clearTimeout(this.send.timer);
      const target = this.$refs.lyric;
      const count = Math.floor(
        (target.scrollTop + target.clientHeight / 2) /
          (target.children[0].clientHeight + 16)
      );
      this.ChangeSong({ stamp: count - 1 });
      this.send(this.lyric.slice(count));
    },
    track({ target }) {
      if (this.active) {
        const now = Date.now();
        clearTimeout(this.send.timer);
        const multiple = parseFloat(target.innerText) > 0 ? 1 : -1;
        let time =
          this.lyric[this.stamp + 1].stamp - this.lyric[this.stamp].stamp;
        time -= now - this.send.stamp - 500 * multiple;
        this.send.stamp -= 500 * multiple;
        this.send.timer = setTimeout(() => {
          clearTimeout(this.send.timer);
          this.send(this.lyric.slice(this.stamp + 1));
        }, time);
      }
    },
    copy() {
      if (this.stamp >= 0 && this.stamp < this.lyric.length) {
        let item = this.lyric[this.stamp];
        item = item.tlyric || item.lyric;
        clipboard.writeText(item);
        this.Notify("已复制：" + item);
      } else this.Notify("尚未播放");
    },
  },
};
</script>
