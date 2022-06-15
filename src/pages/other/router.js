import Vue from "vue";
import VueRouter from "vue-router";

import Video from "./views/Video.vue";
import Candy from "./views/Candy.vue";
import Silent from "./views/Silent.vue";
import Anime from "./views/Anime.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/", name: "Video", component: Video },
  { path: "/candy", name: "Candy", component: Candy },
  { path: "/silent", name: "Silent", component: Silent },
  { path: "/anime", name: "Anime", component: Anime },
];

const router = new VueRouter({
  routes,
});

export default router;
