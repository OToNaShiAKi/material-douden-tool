import Vue from "vue";
import VueRouter from "vue-router";

import Theme from "./views/Theme.vue";
import Cookie from "./views/Cookie.vue";
import Room from "./views/Room.vue";
import Bracket from "./views/Bracket.vue";
import Music from "./views/Music.vue";
// import Live from "./views/Live.vue";
import Shortcut from "./views/Shortcut.vue";
import Shield from "./views/Shield.vue";

import { ipcRenderer } from "electron";

Vue.use(VueRouter);

const routes = [
  { path: "/theme", name: "Theme", component: Theme, meta: { height: 340 } },
  { path: "/cookie", name: "Cookie", component: Cookie, meta: { height: 630 } },
  { path: "/shield", name: "Shield", component: Shield, meta: { height: 630 } },
  { path: "/room", name: "Room", component: Room, meta: { height: 390 } },
  {
    path: "/bracket",
    name: "Bracket",
    component: Bracket,
    meta: { height: 530 },
  },
  { path: "/music", name: "Music", component: Music, meta: { height: 660 } },
  // { path: "/live", name: "Live", component: Live, meta: { height: 640 } },
  {
    path: "/shortcut",
    name: "Shortcut",
    component: Shortcut,
    meta: { height: 640 },
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
