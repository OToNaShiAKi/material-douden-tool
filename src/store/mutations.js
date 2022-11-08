import { ipcRenderer } from "electron";

const ChangeCookie = (state, cookie) => {
  localStorage.setItem("cookie", cookie || "");
  state.cookie = cookie || "";
  if (cookie) {
    const bili_jct = cookie.match(/bili_jct=([^;]+);/);
    if (bili_jct) {
      ipcRenderer.send("ChangeCookie", cookie, bili_jct[1]);
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

const ChangeFixes = (state, fixes = []) => {
  localStorage.setItem("fixes", JSON.stringify(fixes));
  state.fixes = [...fixes];
};

const ChangeRooms = (state, rooms = []) => {
  localStorage.setItem("rooms", JSON.stringify(rooms));
  state.rooms = [...rooms];
};

const ChangeShields = (state, shields = []) => {
  localStorage.setItem("shields", JSON.stringify(shields));
  state.shields = [...shields];
};

const ChangeShortcuts = (state, { key, value }) => {
  const shortcuts = state.shortcuts;
  if (value) shortcuts[key] = value;
  else delete shortcuts[key];
  state.shortcuts = { ...shortcuts };
  localStorage.setItem("shortcuts", JSON.stringify(state.shortcuts));
};

const ChangeSong = (state, { stamp = -1, song = state.song }) => {
  state.song = song;
  song.stamp[-1] = { lyric: "", tlyric: "" };
  state.stamp = stamp;
};

const Notify = (state, text = "") => {
  state.snackbar = { value: true, text };
};

export default {
  ChangeCookie,
  ChangeSelect,
  ChangeFixes,
  ChangeShortcuts,
  ChangeRooms,
  ChangeSong,
  ChangeShields,
  Notify,
};
