import Vue from "vue";
import VueRouter from "vue-router";

import Theme from "./views/Theme.vue";
import Cookie from "./views/Cookie.vue";
import Room from "./views/Room.vue";
import Bracket from "./views/Bracket.vue";
import Music from "./views/Music.vue";
import Live from "./views/Live.vue";
import Shortcut from "./views/Shortcut.vue";
import Shield from "./views/Shield.vue";
import Silent from "./views/Silent.vue";

import { ipcRenderer } from "electron";

Vue.use(VueRouter);

const beforeEnter = (to, from, next) => {
  const cookie = localStorage.getItem("cookie");
  if (!cookie) next("/cookie");
  else next();
};

const routes = [
  { path: "/theme", name: "Theme", component: Theme, meta: { height: 360 } },
  { path: "/cookie", name: "Cookie", component: Cookie, meta: { height: 660 } },
  { path: "/shield", name: "Shield", component: Shield, meta: { height: 660 } },
  {
    path: "/room",
    name: "Room",
    component: Room,
    meta: { height: 660 },
    beforeEnter,
  },
  {
    path: "/bracket",
    name: "Bracket",
    component: Bracket,
    meta: { height: 660 },
  },
  {
    path: "/music",
    name: "Music",
    component: Music,
    meta: { height: 660 },
    beforeEnter,
  },
  {
    path: "/live",
    name: "Live",
    component: Live,
    meta: { height: 660 },
    beforeEnter,
  },
  {
    path: "/silent",
    name: "Silent",
    component: Silent,
    meta: { height: 660 },
    beforeEnter,
  },
  {
    path: "/shortcut",
    name: "Shortcut",
    component: Shortcut,
    meta: { height: 660 },
  },
];

const router = new VueRouter({
  routes,
});

router.afterEach((to) => {
  const { height } = to.meta;
  if (height > 0) ipcRenderer.send("WindowSize", height);
});

export default router;
