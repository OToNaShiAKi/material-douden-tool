import { ipcRenderer } from "electron";

export const ChangeCookie = (state, cookie) => {
  if (cookie) {
    state.cookie = cookie;
    const bili_jct = cookie.match(/bili_jct=([^;]+);/);
    if (bili_jct) {
      ipcRenderer.send(ChangeCookie.name, cookie, bili_jct[1]);
    }
  }
};

export const ChangeSelect = (state, select = []) => {
  state.select = [...select];
};

export default { ChangeCookie, ChangeSelect };
