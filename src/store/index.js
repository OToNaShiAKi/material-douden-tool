import Vue from "vue";
import Vuex from "vuex";

import mutations from "./mutations";

Vue.use(Vuex);

const select = localStorage.getItem("select") || [];
const shortcuts = JSON.parse(localStorage.getItem("shortcuts"));
const fixes = JSON.parse(localStorage.getItem("fixes"));

export default new Vuex.Store({
  state: {
    cookie: "",
    select: Array.isArray(select)
      ? select
      : typeof select === "string"
      ? select.split(",")
      : [],
    fixes: fixes || [
      { prefix: " ", suffix: " ", text: "   " },
      { prefix: "【", suffix: "】", text: "【 】" },
      { prefix: "【♪", suffix: "】", text: "【♪ 】" },
    ],
    shortcuts: shortcuts || [],
    snackbar: "",
  },
  mutations,
});
