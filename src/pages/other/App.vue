<template>
  <v-app>
    <v-navigation-drawer app expand-on-hover permanent>
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
        <router-view />
      </keep-alive>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data: () => ({
    items: [
      { title: "直播追帧", icon: "mdi-video", to: "/" },
      { title: "棉花糖", icon: "mdi-candy", to: "/candy" },
      { title: "禁言用户", icon: "mdi-account-cancel", to: "silent" },
      { title: "动画鉴赏", icon: "mdi-microsoft-excel", to: "anime" },
      { title: "反馈", icon: "mdi-chart-bubble", to: "sponsor" },
    ],
  }),
};
</script>

<style>
*::-webkit-scrollbar {
  width: 0;
}
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
}
.sponsor {
  width: 210px !important;
  display: inline-block !important;
}
</style>
