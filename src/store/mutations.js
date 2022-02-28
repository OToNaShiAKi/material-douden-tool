import { ipcRenderer } from "electron";

export const ChangeCookie = (state, cookie) => {
  localStorage.setItem("cookie", cookie || "");
  state.cookie = cookie || "";
  if (cookie) {
    const bili_jct = cookie.match(/bili_jct=([^;]+);/);
    if (bili_jct) {
      ipcRenderer.send(ChangeCookie.name, cookie, bili_jct[1]);
    }
  }
};

export const ChangeSelect = (state, select = []) => {
  select = Array.isArray(select)
    ? select
    : typeof select === "string"
    ? select.split(",")
    : [];
  localStorage.setItem("select", select);
  state.select = select.filter((v) => v);
};

export const ChangeFixes = (state, fixes = []) => {
  localStorage.setItem("fixes", JSON.stringify(fixes));
  state.fixes = [...fixes];
};

export const ChangeShortcuts = (state, { key, value }) => {
  const shortcuts = state.shortcuts;
  if (value) shortcuts[key] = value;
  else delete shortcuts[key];
  state.shortcuts = { ...shortcuts };
  localStorage.setItem("shortcuts", JSON.stringify(state.shortcuts));
};

export const Notify = (state, text) => {
  state.snackbar = text;
};

export default {
  ChangeCookie,
  ChangeSelect,
  ChangeFixes,
  ChangeShortcuts,
  Notify,
};
