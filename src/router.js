import Vue from "vue";
import VueRouter from "vue-router";
import Theme from "./views/Theme.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/theme",
    name: "Theme",
    component: Theme,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
