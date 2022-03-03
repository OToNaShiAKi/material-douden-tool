import Vue from "vue";
import Vuex from "vuex";

import mutations from "./mutations";

Vue.use(Vuex);

const select = localStorage.getItem("select") || [];
const shortcuts = JSON.parse(localStorage.getItem("shortcuts"));
const fixes = JSON.parse(localStorage.getItem("fixes"));
const rooms = JSON.parse(localStorage.getItem("rooms"));
const shields = JSON.parse(localStorage.getItem("shields"));

export default new Vuex.Store({
  state: {
    cookie: "",
    select: Array.isArray(select)
      ? select
      : typeof select === "string"
      ? select.split(",")
      : [],
    fixes: fixes || [
      { prefix: " ", suffix: " ", text: "   ", scope: "同传" },
      { prefix: "【", suffix: "】", text: "【 】", scope: "同传" },
      { prefix: "【♪", suffix: "】", text: "【♪ 】", scope: "歌曲" },
    ],
    shortcuts: shortcuts || [],
    snackbar: "",
    rooms: rooms || [],
    shields: shields || [],
    stamp: -1,
    song: undefined,
  },
  mutations,
});
