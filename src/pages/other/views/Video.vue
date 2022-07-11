<template>
  <v-container>
    <video controls id="tracing" />
    <p class="d-flex justify-space-between mb-0 caption align-center">
      <span>直播开始时间：{{ new Date(timer * 1000) | FormatTime }}</span>
      <v-btn
        fab
        outlined
        small
        color="primary"
        @click="() => live(selected, true)"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </p>
    <section class="d-flex align-center">
      <v-select class="mr-3" :items="rooms" v-model="selected" @change="live" />
      <v-btn
        small
        outlined
        color="primary"
        class="mr-3"
        :disabled="timer <= 0"
        @click="screenshot"
      >
        记录时点
      </v-btn>
      <v-btn
        small
        outlined
        color="primary"
        :disabled="images.length <= 0"
        @click="save"
      >
        导出时点
      </v-btn>
    </section>
    <section class="d-flex flex-wrap" @click="remove">
      <v-img
        v-for="image of images"
        max-width="200"
        class="ma-2"
        :key="image.key"
        :src="image.src"
      >
        <div class="thumbnail">
          <v-icon style="cursor: pointer" :data-key="image.key" small>
            mdi-delete
          </v-icon>
        </div>
      </v-img>
    </section>
  </v-container>
</template>

<script>
import mpegts from "mpegts.js";
import { ipcRenderer } from "electron";
import { FormatDuration, FormatTime } from "../../../plugins/utils";

const CreatePlayer = (result, video) => {
  const player = mpegts.createPlayer(
    {
      type: result.format_name,
      isLive: true,
      url: result.url_info[0].host + result.base_url + result.url_info[0].extra,
    },
    {
      enableWorker: true,
      enableStashBuffer: false,
      autoCleanupSourceBuffer: true,
    }
  );
  player.attachMediaElement(video);
  player.load();
  player.play();
  player.on(mpegts.Events.ERROR, () => {
    player.unload();
    player.detachMediaElement();
    player.destroy();
    CreatePlayer.player = CreatePlayer(result, video);
  });
  player.on(mpegts.Events.STATISTICS_INFO, () => {
    const end = player.buffered.end(0);
    const current = player.currentTime;
    video.playbackRate = end - current > 1.5 ? 1.5 : 1;
  });
  player.roomid = result.room_id;
  return player;
};

const mseLivePlayback = mpegts.getFeatureList().mseLivePlayback;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1920;
canvas.height = 1080;
ctx.fillStyle = "red";
ctx.font = "normal normal 600 150px/200px Robot";
ctx.textBaseline = "top";

export default {
  name: "Video",
  mounted() {
    const select = (localStorage.getItem("select") || "").split(",");
    this.video = document.getElementById("tracing");
    this.selected = select[0];
    ipcRenderer.on("Live", (event, roomid) => this.live(roomid));
    select[0] && this.live(select[0]);
  },
  data: () => ({
    selected: null,
    rooms: [],
    video: null,
    timer: 0,
    images: [],
  }),
  methods: {
    async live(roomid = this.selected, refresh = false) {
      const live = await ipcRenderer.invoke("TrackLive", roomid);
      this.timer = 0;
      if (
        refresh ||
        (roomid == this.selected &&
          live.live_status &&
          mseLivePlayback &&
          (!CreatePlayer.player || roomid != CreatePlayer.player.roomid))
      ) {
        if (CreatePlayer.player) {
          CreatePlayer.player.unload();
          CreatePlayer.player.detachMediaElement();
          CreatePlayer.player.destroy();
        }
        CreatePlayer.player = CreatePlayer(live, this.video);
        this.timer = live.live_time;
      }
      const rooms = JSON.parse(localStorage.getItem("rooms"));
      const select = (localStorage.getItem("select") || "").split(",");
      this.rooms = rooms.filter(({ value }) => select.includes(value));
    },
    screenshot() {
      const key = Date.now();
      const time = FormatDuration(Math.floor(key / 1000 - this.timer), true);
      ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
      ctx.fillText(time, 60, 60);
      this.images.push({
        src: canvas.toDataURL("image/jpg"),
        time,
        key: key.toString(),
      });
    },
    remove({ target: { dataset } }) {
      const { key } = dataset;
      this.images = this.images.filter((v) => v.key !== key);
    },
    save() {
      const datas = this.images.map(({ src }) =>
        src.replace(/^data:image\/(png|gif|jpeg);base64,/, "")
      );
      ipcRenderer.send("SaveFiles", datas, Date.now().toString(), "base64");
    },
  },
  filters: {
    FormatTime: (timer) =>
      timer > 0 ? FormatTime(timer) : "未开播（监控开播中）",
  },
};
</script>
