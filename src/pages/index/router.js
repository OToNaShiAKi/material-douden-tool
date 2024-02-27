import Vue from "vue";
import VueRouter from "vue-router";

import Live from "./views/Live.vue";
import Room from "./views/Room.vue";
import Music from "./views/Music.vue";
import Shortcut from "./views/Shortcut.vue";
import Bracket from "./views/Bracket.vue";
import Cookie from "./views/Cookie.vue";
import Shield from "./views/Shield.vue";
import Setting from "./views/Setting.vue";

import { ipcRenderer } from "electron";

Vue.use(VueRouter);

const beforeEnter = (to, from, next) => {
  const cookie = localStorage.getItem("cookie");
  if (!cookie) next("/cookie");
  else next();
};

const routes = [
  { path: "/live", name: "Live", component: Live, beforeEnter,meta: { height: 652 }, },
  {
    path: "/room",
    name: "Room",
    component: Room,
    beforeEnter,
    meta: { height: 658 },
  },
  {
    path: "/music",
    name: "Music",
    component: Music,
    beforeEnter,
    meta: { height: 668 },
  },
  {
    path: "/shortcut",
    name: "Shortcut",
    component: Shortcut,
    meta: { height: 658 },
  },
  {
    path: "/bracket",
    name: "Bracket",
    component: Bracket,
    meta: { height: 526 },
  },
  { path: "/cookie", name: "Cookie", component: Cookie, meta: { height: 608 } },
  { path: "/shield", name: "Shield", component: Shield, meta: { height: 558 } },
  {
    path: "/setting",
    name: "Setting",
    component: Setting,
    meta: { height: 468 },
  },
];

const router = new VueRouter({ routes });

router.afterEach((to) => {
  const { height } = to.meta;
  if (height > 0) ipcRenderer.send("WindowSize", height);
});

export default router;
