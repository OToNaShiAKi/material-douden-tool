<template>
  <v-container class="fix-input">
    <video class="rounded-lg" controls id="tracing" />
    <p class="d-flex justify-space-between caption align-center">
      <span>
        开始时间：{{ new Date(timer * 1000) | FormatTime }}
        <br />
        开播后同传输入框中按下Alt+P即可记录时点
      </span>
      <v-btn icon color="primary" @click="() => Live(selected, true)">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </p>
    <v-select
      class="input-avatar"
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
    <section class="d-flex mt-3 flex-wrap" @click="Remove">
      <v-img
        v-for="image of images"
        max-width="200"
        class="ma-2 rounded-lg"
        :key="image.key"
        :src="image.src"
      >
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
import mpegts from "mpegts.js";
import { ipcRenderer } from "electron";

const mseLivePlayback = mpegts.getFeatureList().mseLivePlayback;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1920;
canvas.height = 1080;
ctx.fillStyle = "red";
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
  methods: {
    async Live({ value: roomid }, refresh = false) {
      const live = await ipcRenderer.invoke("TrackLive", roomid);
      if (
        refresh ||
        (roomid == this.selected.value &&
          live.live_status &&
          mseLivePlayback &&
          (!CreatePlayer.player || roomid != CreatePlayer.player.roomid))
      ) {
        const video = document.getElementById("tracing");
        if (CreatePlayer.player) {
          CreatePlayer.player.unload();
          CreatePlayer.player.detachMediaElement();
          CreatePlayer.player.destroy();
        }
        CreatePlayer.player = CreatePlayer(live, video);
      }
      this.timer = live.live_time;
      const rooms = JSON.parse(localStorage.getItem("rooms"));
      const select = (localStorage.getItem("select") || "").split(",");
      this.rooms = rooms.filter(({ value }) => select.includes(value));
      if (!this.rooms.find(({ value }) => value === this.selected.value)) {
        this.selected = this.rooms[0] || "";
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
      const datas = this.images.map(({ src }) =>
        src.replace(/^data:image\/(png|gif|jpeg);base64,/, "")
      );
      ipcRenderer.send("SaveFiles", datas, Date.now().toString(), "base64");
    },
    Remove({ target: { dataset } }) {
      const { key } = dataset;
      this.images = this.images.filter((v) => v.key !== key);
      localStorage.setItem("screenshot", JSON.stringify(this.images));
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
  position: absolute;
  right: 0;
  bottom: 0;
  cursor: pointer;
}
</style>
