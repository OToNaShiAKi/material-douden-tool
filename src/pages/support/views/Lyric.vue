<template>
  <v-container class="fix-input">
    <v-file-input
      prepend-icon="mdi-folder-music"
      solo
      dense
      label="上传Aegisub文件"
      hint="若含双语歌轴，请确保样式名分别为 Defaut 和 Default - Translate"
      @change="Upload"
    />
    <section class="d-flex">
      <v-text-field
        label="歌手"
        v-model="singer"
        solo
        class="mr-2"
        dense
        hide-details
        prepend-icon="mdi-account-music"
      />
      <v-text-field
        label="歌名"
        v-model="name"
        hide-details
        solo
        class="ml-2"
        dense
        prepend-icon="mdi-music-circle"
      />
    </section>
    <v-subheader>
      <span class="mr-1">时间轴 - 歌词 - 翻译</span>
      <v-icon
        :color="K ? 'primary' : undefined"
        :disabled="!(lyric[0] && lyric[0].ylyric)"
        @click="K = !K"
      >
        mdi-alpha-k
      </v-icon>
    </v-subheader>
    <section>
      <section class="d-flex align-center mb-3" v-for="v of lyric" :key="v.id">
        <v-text-field
          hide-details
          dense
          solo
          type="time"
          class="flex-grow-0 flex-shrink-1 mr-3"
          v-model="v.start"
          step="0.1"
        />
        <v-text-field
          hide-details
          dense
          solo
          type="time"
          class="flex-grow-0 flex-shrink-1 mr-3"
          v-model="v.end"
          step="0.1"
        />
        <v-text-field
          v-if="K && v.ylyric"
          v-model="v.ylyric"
          hide-details
          dense
          solo
          class="mr-3"
        />
        <v-text-field
          v-else
          v-model="v.lyric"
          hide-details
          dense
          solo
          class="mr-3"
        />
        <v-text-field
          v-if="K && v.tylyric"
          v-model="v.tylyric"
          hide-details
          dense
          solo
          class="mr-3"
        />
        <v-text-field v-model="v.tlyric" hide-details dense solo class="mr-3" />
        <v-btn @click="Remove" icon small class="float-right" :data-key="v.id">
          <v-icon small :data-key="v.id">mdi-delete</v-icon>
        </v-btn>
      </section>
    </section>
    <section
      class="d-flex justify-space-between align-center mb-3 lyric-control"
    >
      <v-btn icon color="primary" @click="Add">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn-toggle dense rounded>
        <v-btn icon :disabled="!name || !singer" @click="Save">
          <v-icon>mdi-book-music</v-icon>
        </v-btn>
        <v-btn icon @click="Aegisub">
          <v-icon>mdi-export</v-icon>
        </v-btn>
      </v-btn-toggle>
    </section>
    <v-chip-group column color="primary" v-model="id" @change="Change">
      <v-chip
        v-for="v of lists"
        close
        @click:close="() => Close(v.id)"
        close-icon="mdi-delete"
        :key="v.id"
        :value="v.id"
      >
        {{ v.name }} - {{ v.singer }}
      </v-chip>
    </v-chip-group>
  </v-container>
</template>

<script>
import {
  GetLocalData,
  RemoveLocalData,
  SaveLocalData,
} from "../../../plugins/indexedDB";
import {
  ExportAegisub,
  LineStart,
  ReadLyric,
  SaveLyric,
  ConvertLyric,
} from "../../../util/ExportFile";
import { ipcRenderer } from "electron";

export default {
  name: "Lyric",
  data: () => ({
    lyric: [{ ...LineStart }],
    name: "",
    singer: "",
    avatar: "",
    lists: [],
    K: false,
    id: "",
  }),
  async created() {
    this.lists = await GetLocalData("music");
  },
  props: { music: { type: Object, required: false } },
  watch: {
    music: {
      immediate: true,
      handler(next) {
        if (next) {
          next = ConvertLyric(next);
          this.name = next.name;
          this.singer = next.singer;
          this.lyric = next.lyric;
          this.K = next.lyric[0] && next.lyric[0].ylyric;
          this.id = "";
        }
      },
    },
  },
  methods: {
    async Upload(file) {
      if (file) {
        const lyric = await ReadLyric(file);
        this.name = file.name;
        this.lyric = lyric;
        this.K = lyric[0] && lyric[0].ylyric;
      } else {
        this.lyric = [{ ...LineStart }];
      }
      this.id = "";
    },
    Aegisub() {
      const Lyric = ExportAegisub(this.lyric, this.K);
      const file = `${this.name} - ${this.singer}.ass`;
      ipcRenderer.send("SaveFiles", Lyric, file, "utf8");
    },
    Add() {
      if (this.lyric.length <= 0) {
        this.lyric = [{ ...LineStart }];
        return;
      }
      let time = this.lyric[this.lyric.length - 1];
      time = (time.end || time.start).split(":");
      time[1] = (parseInt(time[1]) + 2).toString().padStart(2, "0");
      time = time.join(":");
      this.lyric.push({
        start: time,
        end: time,
        lyric: "",
        tlyric: "",
        id: time,
      });
    },
    Remove({ target }) {
      const key =
        target.dataset.key ||
        target.parentElement.dataset.key ||
        target.parentElement.parentElement.dataset.key;
      this.lyric = this.lyric.filter(({ id }) => id !== key);
    },
    async Save() {
      const music = SaveLyric(this.lyric, this.name, this.singer, this.id);
      await SaveLocalData("music", music);
      this.lists = await GetLocalData("music");
      this.lyric = [{ ...LineStart }];
      this.singer = "";
      this.name = "";
      this.id = "";
    },
    Change(value) {
      const find = this.lists.find(({ id }) => id === value);
      this.lyric = find.stamps;
      this.id = find.id;
      this.name = find.name;
      this.singer = find.singer;
      this.K = find.stamps[0] && find.stamps[0].ylyric;
    },
    async Close(key) {
      await RemoveLocalData("music", key);
      this.lists = await GetLocalData("music");
    },
  },
};
</script>
