<template>
  <section>
    <Pack>歌词获取</Pack>
    <v-text-field
      v-model="keyword"
      prepend-inner-icon="mdi-magnify"
      append-icon="mdi-arrow-left-bottom"
      @keypress.enter="search"
      label="关键词"
    />
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
          <v-btn text small>-0.5s</v-btn>
          <v-btn
            fab
            small
            class="mx-3"
            depressed
            @click="send"
            :color="active ? 'primary' : 'secondary'"
          >
            <v-icon>{{ active ? "mdi-pause" : "mdi-play" }}</v-icon>
          </v-btn>
          <v-btn text small>+0.5s</v-btn>
        </section>
        <section>
          <p v-for="v of lyric" :key="v.stamp" class="text-center flex-column">
            <span class="text-body-1">{{ v.lyric }}</span>
            <br />
            <span class="text-body-2">{{ v.tlyric }}</span>
          </p>
        </section>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import Pack from "../components/Pack.vue";
import { GetMusic, SendComment } from "../plugins/axios";
import { mapState } from "vuex";

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
      console.log(item);
      this.lyric = item.stamp;
      this.tab = "lyric";
      clearTimeout(this.timer);
      this.timer = null;
      this.stamp = 0;
    },
    send() {
      this.active = !this.active;
      const SendLyric = (lyric, roomids = [], fix = "") => {
        const [prefix = "", suffix = ""] = fix.split(" ");
        const comment = prefix + (lyric[0].tlyric || lyric[0].lyric) + suffix;
        ipcRenderer.send(SendComment.name, roomids, comment);
        this.stamp += 1;
        if (lyric.length <= 1) {
          this.timer = null;
          return;
        }
        console.log(lyric);
        this.timer = setTimeout(() => {
          clearTimeout(this.timer);
          SendLyric(lyric.slice(1), roomids, fix);
        }, lyric[1].stamp - lyric[0].stamp);
      };
      if (this.active)
        SendLyric(this.lyric.slice(this.stamp), this.select, this.fix);
      else clearTimeout(SendLyric.timer);
    },
  },
};
</script>
