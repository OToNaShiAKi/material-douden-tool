<template>
  <v-container class="fix-input">
    <video class="rounded-lg" controls id="tracing" />
    <section class="d-flex justify-space-between caption align-center">
      <p class="ma-0">
        开始时间：{{ new Date(timer * 1000) | FormatTime }}
        <br />
        开播后同传输入框中按下Alt+P即可记录时点，并可在截图中输入关键字
      </p>
      <v-select
        class="input-avatar mx-6"
        :items="rooms"
        solo
        hide-details
        return-object
        v-model="selected"
        @change="Live"
        dense
      >
        <template v-slot:prepend>
          <v-btn
            :disabled="!timer || timer <= 0"
            @click="Screenshot"
            icon
            color="primary"
          >
            <v-icon>mdi-monitor-screenshot</v-icon>
          </v-btn>
        </template>
        <template v-slot:item="{ item, on, attrs }">
          <v-list-item v-on="on" v-bind="attrs">
            <v-list-item-avatar>
              <v-img referrepolicy="no-referrer" :src="item.avatar" />
            </v-list-item-avatar>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item>
        </template>
        <template v-slot:prepend-inner>
          <v-avatar size="32">
            <v-img :src="selected.avatar" />
          </v-avatar>
        </template>
        <template v-slot:append-outer>
          <v-btn
            icon
            color="primary"
            :disabled="images.length <= 0"
            @click="Save"
          >
            <v-icon>mdi-export</v-icon>
          </v-btn>
        </template>
      </v-select>
      <v-select
        class="flex-grow-0 mr-3"
        v-model="quality"
        @change="(value) => Live(selected, value, true)"
        solo
        hide-details
        dense
        :items="qns"
        :prepend-inner-icon="icon"
      >
        <template v-slot:item="{ item, on, attrs }">
          <v-list-item v-on="on" v-bind="attrs">
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-select>
      <v-btn icon color="primary" @click="() => Live(selected, quality, true)">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </section>
    <section
      class="d-flex mt-3 flex-wrap"
      @keyup.stop.prevent.enter="Input"
      @click="Remove"
    >
      <v-img
        v-for="(image, index) of images"
        max-width="200"
        class="ma-2 rounded-lg"
        :key="image.key"
        :src="image.src"
        content-class="relative"
      >
        <p
          class="keyword pa-1 ma-0"
          :data-index="index"
          contenteditable="true"
        />
        <v-icon
          class="thumbnail"
          style="cursor: pointer"
          :data-key="image.key"
          small
        >
          mdi-delete
        </v-icon>
      </v-img>
    </section>
  </v-container>
</template>

<script>
import { CreatePlayer } from "../../../util/CreatePlayer";
import { FormatTime, FormatDuration } from "../../../util/Format";
import { Base64 } from "../../../util/ExportFile";

import mpegts from "mpegts.js";
import { ipcRenderer } from "electron";

const mseLivePlayback = mpegts.getFeatureList().mseLivePlayback;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1920;
canvas.height = 1080;
ctx.fillStyle = "#F00";
ctx.font = "normal normal 600 150px/200px Robot";
ctx.textBaseline = "top";

const Screenshot = JSON.parse(localStorage.getItem("screenshot")) || [];

export default {
  name: "Video",
  data: () => ({
    selected: "",
    rooms: [],
    images: Screenshot,
    timer: null,
    qns: [],
    quality: 0,
  }),
  mounted() {
    const select = (localStorage.getItem("select") || "").split(",");
    const rooms = JSON.parse(localStorage.getItem("rooms"));
    ipcRenderer.on("Live", (event, roomid) => this.Live({ value: roomid }));
    ipcRenderer.on("Point", this.Screenshot.bind(this));
    if (select[0]) {
      const find = rooms.find(({ value }) => select.includes(value));
      this.selected = find;
      this.Live(find);
    }
  },
  computed: {
    icon: ({ quality, qns }) => {
      const find = qns.find(({ value }) => value === quality);
      return find && find.icon;
    },
  },
  methods: {
    async Live({ value: roomid }, qn = this.quality, refresh = false) {
      const live = await ipcRenderer.invoke("TrackLive", roomid, qn);
      const rooms = JSON.parse(localStorage.getItem("rooms"));
      const select = (localStorage.getItem("select") || "").split(",");
      this.rooms = rooms.filter(({ value }) => select.includes(value));
      if (!this.rooms.find(({ value }) => value === this.selected.value)) {
        this.selected = this.rooms[0] || "";
      }
      this.timer = live.live_time;

      if (refresh) {
        CreatePlayer.player.roomid = null;
        live.live_status = 1;
        live.live_time = -1;
      }

      if (
        roomid == this.selected.value &&
        live.live_status &&
        live.live_time &&
        mseLivePlayback &&
        (!CreatePlayer.player || roomid != CreatePlayer.player.roomid)
      ) {
        const video = document.getElementById("tracing");
        if (CreatePlayer.player) {
          CreatePlayer.player.unload();
          CreatePlayer.player.detachMediaElement();
          CreatePlayer.player.destroy();
        }
        this.qns = live.accept_qn;
        this.quality = live.current_qn;
        CreatePlayer.player = CreatePlayer(live, video);
      }
    },
    Screenshot() {
      if (!this.timer || this.timer <= 0) return;
      const key = Date.now();
      const video = document.getElementById("tracing");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      let text = FormatTime(new Date(this.timer * 1000)).split(" ")[0];
      ctx.fillText(text, 60, 60);
      text = FormatDuration(Math.floor(key / 1000 - this.timer), true);
      ctx.fillText(text, 60, 240);
      this.images.push({
        src: canvas.toDataURL("image/jpg"),
        key: key.toString(),
      });
      localStorage.setItem("screenshot", JSON.stringify(this.images));
    },
    Save() {
      const datas = this.images.map(({ src }) => src.replace(Base64, ""));
      const date = Date.now().toString() + ".png";
      ipcRenderer.send("SaveFiles", datas, date, "base64");
      this.images = [];
      localStorage.setItem("screenshot", JSON.stringify([]));
    },
    Remove({ target: { dataset } }) {
      const { key } = dataset;
      this.images = this.images.filter((v) => v.key !== key);
      localStorage.setItem("screenshot", JSON.stringify(this.images));
    },
    Input(event) {
      const target = event.target;
      const { index } = target.dataset;
      const image = new Image();
      image.src = this.images[index].src;
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.fillText(target.innerText, 60, 420);
        this.images[index].src = canvas.toDataURL("image/jpg");
        localStorage.setItem("screenshot", JSON.stringify(this.images));
        target.innerText = "";
        target.blur();
      };
    },
  },
  filters: {
    FormatTime: (timer) =>
      timer > 0 ? FormatTime(timer) : "未开播（监控开播中）",
  },
};
</script>

<style>
video {
  width: 100%;
}
video::-webkit-media-controls-timeline {
  display: none;
}
.thumbnail {
  position: absolute !important;
  right: 0;
  bottom: 0;
}
.keyword {
  position: absolute !important;
  top: 40px;
  left: 0;
  height: calc(100% - 40px);
  width: 100%;
  line-height: 20px;
  font-size: 12px;
  color: #f00;
  font-weight: bold;
}
</style>
