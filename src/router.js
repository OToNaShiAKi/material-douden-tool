import Vue from "vue";
import VueRouter from "vue-router";
import Theme from "./views/Theme.vue";
import Cookie from "./views/Cookie.vue";
import Room from "./views/Room.vue";
import Bracket from "./views/Bracket.vue";
import Music from "./views/Music.vue";
import Live from "./views/Live.vue";
import Shortcut from "./views/Shortcut.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/theme", name: "Theme", component: Theme },
  { path: "/cookie", name: "Cookie", component: Cookie },
  { path: "/room", name: "Room", component: Room },
  { path: "/bracket", name: "Bracket", component: Bracket },
  { path: "/music", name: "Music", component: Music },
  { path: "/live", name: "Live", component: Live },
  { path: "/shortcut", name: "Shortcut", component: Shortcut },
];

const router = new VueRouter({
  routes,
});

export default router;
