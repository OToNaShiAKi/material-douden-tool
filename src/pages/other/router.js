import Vue from "vue";
import VueRouter from "vue-router";
import Candy from "./views/Candy.vue";

Vue.use(VueRouter);

const routes = [{ path: "/", name: "Candy", component: Candy }];

const router = new VueRouter({
  routes,
});

export default router;
