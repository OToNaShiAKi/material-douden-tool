import Vue from "vue";
import VueRouter from "vue-router";

import Video from "./views/Video.vue";
import Candy from "./views/Candy.vue";
import Silent from "./views/Silent.vue";
import Anime from "./views/Anime.vue";
import Lyric from "./views/Lyric.vue";
import Sponsor from "./views/Sponsor.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/", name: "Video", component: Video },
  { path: "/candy", name: "Candy", component: Candy },
  { path: "/silent", name: "Silent", component: Silent },
  { path: "/anime", name: "Anime", component: Anime },
  { path: "/lyric", name: "Lyric", component: Lyric },
  { path: "/sponsor", name: "Sponsor", component: Sponsor },
];

const router = new VueRouter({ routes });

export default router;
