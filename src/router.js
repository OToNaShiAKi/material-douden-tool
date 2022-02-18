import Vue from "vue";
import VueRouter from "vue-router";
import Theme from "./views/Theme.vue";
import Cookie from "./views/Cookie.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/theme", name: "Theme", component: Theme },
  { path: "/cookie", name: "Cookie", component: Cookie },
];

const router = new VueRouter({
  routes,
});

export default router;
