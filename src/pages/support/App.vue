<template>
  <v-app>
    <v-navigation-drawer class="rounded-lg ma-3" app expand-on-hover permanent>
      <v-list dense nav>
        <v-list-item
          color="primary"
          v-for="item of items"
          :key="item.to"
          :to="item.to"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <keep-alive>
        <router-view :music="music" />
      </keep-alive>
    </v-main>
  </v-app>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "App",
  created() {
    ipcRenderer.on("ConvertLyric", async (event, music) => {
      const video = document.getElementById("tracing");
      video && !video.paused && video.requestPictureInPicture();
      this.$route.name !== "Lyric" && this.$router.push("/lyric");
      this.music = music;
    });
    ipcRenderer.on("WindowStyle", async (event, value) => {
      this.$vuetify.theme.themes.light.primary = value;
      this.$vuetify.theme.themes.dark.primary = value;
    });
  },
  data: () => ({
    music: null,
    items: [
      { title: "直播追帧", icon: "mdi-video", to: "/" },
      { title: "棉花糖", icon: "mdi-candy", to: "/candy" },
      { title: "禁言用户", icon: "mdi-account-cancel", to: "/silent" },
      { title: "动画鉴赏", icon: "mdi-microsoft-excel", to: "/anime" },
      { title: "歌词制作", icon: "mdi-playlist-music", to: "/lyric" },
      { title: "成就", icon: "mdi-seal", to: "/seal" },
      { title: "反馈", icon: "mdi-chart-bubble", to: "/sponsor" },
    ],
  }),
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
.sponsor {
  width: 210px !important;
  display: inline-block !important;
}
</style>
