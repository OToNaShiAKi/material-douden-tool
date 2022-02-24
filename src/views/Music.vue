<template>
  <section>
    <Pack>歌词获取</Pack>
    <section class="d-flex">
      <v-select v-model="fix" :items="fixes" class="mr-3 select-width" />
      <v-text-field
        v-model="keyword"
        prepend-inner-icon="mdi-magnify"
        append-icon="mdi-arrow-left-bottom"
        @keypress.enter="search"
        label="关键词"
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
        <section ref="lyric" style="height: 256px; overflow: auto">
          <p
            v-for="(v, i) of lyric"
            :key="v.stamp"
            class="text-center flex-column"
            :class="i === stamp && 'primary--text'"
          >
            <span class="text-body-1">{{ v.lyric }}</span>
            <br />
            <span class="text-body-2">{{ v.tlyric }}</span>
          </p>
        </section>
        <section class="d-flex justify-center align-center mt-3">
          <v-btn text small>复制此句</v-btn>
          <v-btn text small>-0.5s</v-btn>
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
          <v-btn text small>+0.5s</v-btn>
          <v-btn text small @click="next">发送下句</v-btn>
        </section>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
import Pack from "../components/Pack.vue";
import { GetMusic } from "../plugins/axios";
import { mapState } from "vuex";
import { clipboard, ipcRenderer } from "electron";
import { FormatComment } from "../plugins/utils";

export default {
  name: "Music",
  components: { Pack },
  data: () => ({
    keyword: "",
    headers: [
      { text: "歌名", value: "name" },
      { text: "歌手", value: "singer" },
      { text: "语言", value: "language" },
      { text: "来源", value: "origin" },
    ],
    musics: [],
    loading: false,
    tab: "table",
    lyric: [],
    stamp: 0,
    active: false,
    fix: "",
  }),
  computed: { ...mapState(["fixes", "select"]) },
  methods: {
    async search() {
      this.loading = true;
      this.tab = "table";
      const result = await ipcRenderer.invoke(GetMusic.name, this.keyword);
      this.keyword = "";
      this.musics = result;
      this.loading = false;
    },
    async choose(item) {
      this.lyric = item.stamp;
      this.tab = "lyric";
      clearTimeout(this.send.timer);
      this.send.timer = null;
      this.stamp = -1;
    },
    play() {
      this.active = !this.active;
      if (this.active) this.send(this.lyric.slice(this.stamp + 1));
      else clearTimeout(this.send.timer);
    },
    send(lyric) {
      this.stamp += 1;
      this.$vuetify.goTo(this.stamp * 64, {
        container: this.$refs.lyric,
        offset: 64,
        easing: "easeInOutCubic",
      });
      FormatComment(lyric[0].tlyric, this.select, this.fix);
      if (lyric.length <= 1) {
        this.send.timer = null;
        this.active = false;
        this.stamp = -1;
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
    copy() {
      clipboard.writeText(this.lyric[this.stamp].tlyric);
    },
  },
};
</script>
