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
        v-model.trim="keyword"
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
          <v-btn text small @click="reset">重置播放</v-btn>
          <v-btn text small :disabled="!active" @click="track">-0.5s</v-btn>
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
          <v-btn text small :disabled="!active" @click="track">+0.5s</v-btn>
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
import { FormatComment } from "../../../plugins/utils";
import { ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
import Pack from "../../../components/Pack.vue";

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
    fixes: ({ $store: { state } }) =>
      state.fixes.filter((v) => v.scope !== "同传"),
    lyric: ({ $store: { state } }) => state.song.stamp || [],
    languages: ({ $store: { state } }) => {
      const result = ["原文"];
      result.height = 40;
      if (state.song.lyric && state.song.tlyric) {
        result.push("翻译", "双语");
        result.height = 64;
      }
      return result;
    },
  },
  methods: {
    ...mapMutations(["Notify", "ChangeSong"]),
    async search() {
      if (this.keyword.length <= 0) {
        this.message = "关键词不可为空";
        return;
      }
      this.loading = true;
      this.tab = "table";
      this.message = "";
      this.musics = await ipcRenderer.invoke("GetMusic", this.keyword);
      this.loading = false;
    },
    async choose(item) {
      this.tab = "lyric";
      this.language = this.languages.includes(this.language)
        ? this.language
        : this.languages[1] || this.languages[0];
      this.reset();
      this.ChangeSong({ song: item, stamp: -1 });
    },
    play() {
      this.active = !this.active;
      if (this.active) this.send(this.stamp + 1);
      else clearTimeout(this.send.timer);
    },
    send(index) {
      const lyric = this.lyric;
      if (/翻译|双语/.test(this.language) && lyric[index].tlyric)
        FormatComment(lyric[index].tlyric, this.select, this.fix, this.shields);
      if (/原文|双语/.test(this.language) && this.lyric[index].lyric)
        FormatComment(lyric[index].lyric, this.select, this.fix, this.shields);
      this.ChangeSong({ stamp: index });
      this.send.stamp = Date.now();
      this.$vuetify.goTo(this.stamp * this.languages.height, {
        container: this.$refs.lyric,
        offset: 128 - this.languages.height,
        easing: "easeInOutCubic",
      });
      if (index === lyric.length - 1) {
        this.reset();
        return;
      }
      this.send.timer =
        this.active &&
        setTimeout(() => {
          clearTimeout(this.send.timer);
          this.send(index + 1);
        }, lyric[index + 1].stamp - lyric[index].stamp);
    },
    next() {
      clearTimeout(this.send.timer);
      this.send(this.stamp + 1);
    },
    jump() {
      clearTimeout(this.send.timer);
      const target = this.$refs.lyric;
      const count = Math.floor(
        (target.scrollTop + target.clientHeight / 2) / this.languages.height
      );
      this.active = true;
      this.ChangeSong({ stamp: count });
      this.send(count);
    },
    track({ target }) {
      const now = Date.now();
      clearTimeout(this.send.timer);
      const multiple = parseFloat(target.innerText) > 0 ? 1 : -1;
      let time =
        this.lyric[this.stamp + 1].stamp - this.lyric[this.stamp].stamp;
      time -= now - this.send.stamp - 500 * multiple;
      this.send.stamp -= 500 * multiple;
      this.send.timer = setTimeout(() => {
        clearTimeout(this.send.timer);
        this.send(this.stamp + 1);
      }, time);
    },
    reset() {
      clearTimeout(this.send.timer);
      this.send.timer = null;
      this.$refs.lyric &&
        this.$vuetify.goTo(0, {
          container: this.$refs.lyric,
          easing: "easeInOutCubic",
        });
      this.ChangeSong({ stamp: -1 });
      this.active = false;
    },
  },
};
</script>
