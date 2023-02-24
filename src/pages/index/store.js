import Vue from "vue";
import Vuex from "vuex";
import { ipcRenderer } from "electron";

Vue.use(Vuex);

const select = localStorage.getItem("select") || [];
const shortcuts = JSON.parse(localStorage.getItem("shortcuts")) || [];
const fixes = JSON.parse(localStorage.getItem("fixes")) || [
  { prefix: " ", suffix: " ", text: "   ", scope: "弹幕" },
  { prefix: "【", suffix: "】", text: "【 】", scope: "同传" },
  { prefix: "【♪", suffix: "】", text: "【♪ 】", scope: "歌曲" },
];
const rooms = JSON.parse(localStorage.getItem("rooms")) || [];
const shields = JSON.parse(localStorage.getItem("shields")) || [];
const stamps = [];
stamps[-1] = { lyric: "", tlyric: "" };

const ChangeCookie = async (state, cookie) => {
  localStorage.setItem("cookie", cookie || "");
  state.cookie = cookie || "";
  if (cookie) {
    const bili_jct = cookie.match(/bili_jct=([^;]+);/);
    if (bili_jct) {
      state.avatar = await ipcRenderer.invoke("Cookie", cookie, bili_jct[1]);
    }
  }
};

const ChangeSelect = (state, select = []) => {
  select = Array.isArray(select)
    ? select
    : typeof select === "string"
    ? select.split(",")
    : [];
  localStorage.setItem("select", select);
  state.select = select.filter((v) => v);
};

const ChangeConfig = (state, { key, config = [] }) => {
  state[key] = [...config];
  if (key === "rooms") {
    config = config.map((item) => ({
      value: item.value,
      text: item.text,
      uid: item.uid,
      avatar: item.avatar,
    }));
  }
  localStorage.setItem(key, JSON.stringify(config));
};

const ChangeShortcuts = (state, { key, value }) => {
  const shortcuts = state.shortcuts;
  if (value) shortcuts[key] = value;
  else delete shortcuts[key];
  state.shortcuts = { ...shortcuts };
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
};

const ChangeSong = (state, { stamp = -1, song = state.song }) => {
  song.stamps[-1] = { lyric: "", tlyric: "" };
  state.stamp = stamp;
  state.song = song;
};

const Notify = (state, text = "") => {
  state.snackbar = { value: true, text };
};

export default new Vuex.Store({
  state: {
    cookie: "",
    select: Array.isArray(select)
      ? select
      : typeof select === "string"
      ? select.split(",")
      : [],
    shortcuts,
    fixes: fixes,
    rooms,
    shields,
    snackbar: { value: false, text: "" },
    song: { stamps, singer: "", name: "" },
    stamp: -1,
    avatar: "",
  },
  mutations: {
    ChangeCookie,
    ChangeSelect,
    ChangeConfig,
    ChangeShortcuts,
    ChangeSong,
    Notify,
  },
});
