import { Bilibili, Login } from "./plugins/headers";
import CreateWindow, { AllWindows } from "./background";
import { ipcMain, BrowserWindow, screen } from "electron";
import {
  GetQRCode,
  GetLoginInfo,
  GetUserRoomMode,
  SearchLive,
  SearchUser,
  GetMedalWall,
  ChangeMedal,
  TakeOffModel,
  GetFollowLive,
  SetUserRoomMode,
  GetMusic,
} from "./plugins/axios";
import { Stacks } from "./util/server";

const options = {
  alwaysOnTop: false,
  frame: true,
  titleBarStyle: "default",
  transparent: false,
};

ipcMain.on("WindowSize", (event, height) => {
  const win = BrowserWindow.fromId(AllWindows.index);
  const [width] = win.getSize();
  win.setSize(width, height, true);
});

ipcMain.on("OtherWindow", async (event, page, DevTools = false) => {
  const win = AllWindows[page] && BrowserWindow.fromId(AllWindows[page]);
  if (win && DevTools) {
    win.webContents.openDevTools();
  } else if (!win) {
    const size = screen.getPrimaryDisplay().workAreaSize;
    win = await CreateWindow(page, { ...size, ...options });
  }
});

ipcMain.on("Channel", async (event, channel, data, create = false) => {
  let win = AllWindows.support && BrowserWindow.fromId(AllWindows.support);
  if (!win && create) {
    const size = screen.getPrimaryDisplay().workAreaSize;
    win = await CreateWindow("support", { ...size, ...options });
  }
  if (win) {
    win.focus();
    win.webContents.send(channel, data);
  }
});

ipcMain.on("SendComment", (event, message, roomid) => {
  Stacks.Messages.push({ message, id: roomid });
  if (!Stacks.timer) {
    Stacks.interval();
    Stacks.timer = setInterval(Stacks.interval, 1000);
  }
});

ipcMain.handle("BilibiliLogin", async () => {
  const { url, oauthKey } = await GetQRCode();
  const timer = setInterval(async () => {
    const { status = false, data } = await GetLoginInfo(oauthKey);
    if (status || data === -2) {
      clearInterval(timer);
      const query =
        typeof data === "object" &&
        data.url
          .slice(data.url.indexOf("?") + 1)
          .replace(/\?/g, "")
          .replace(/&/g, ";");
      const win = BrowserWindow.fromId(AllWindows.index);
      win.webContents.send("Login", { status, data, query });
    }
  }, 3000);
  if (!(url && oauthKey)) clearInterval(timer);
  return url;
});

ipcMain.on("ChangeCookie", (event, cookie, csrf) => {
  Bilibili.defaults.headers["Cookie"] = cookie;
  Login.defaults.headers["Cookie"] = cookie;
  Bilibili.defaults.data = {
    csrf,
    csrf_token: csrf,
    rnd: Math.floor(Date.now() / 1000),
  };
});

ipcMain.handle("SearchLive", async (event, keyword) => {
  const match = /^\d+$/.test(keyword);
  const [search, uid] = await Promise.all([
    SearchLive(keyword),
    match && SearchUser(keyword),
  ]);
  uid && search.unshift(uid);
  return search;
});

ipcMain.handle("GetUserRoomMode", async (event, roomid) => {
  const result = await GetUserRoomMode(roomid);
  let colors = [];
  result.modes = result.modes
    .filter(({ status }) => status)
    .map(({ name, mode }) => ({ text: name, value: mode }));
  for (const { color } of result.colors) {
    colors = colors.concat(
      color
        .filter(({ status }) => status)
        .map(({ color_hex, name }) => ({ text: name, value: color_hex }))
    );
  }
  result.colors = colors;
  return result;
});

ipcMain.handle("SetUserRoomMode", SetUserRoomMode);

ipcMain.handle("GetFollowLive", GetFollowLive);

ipcMain.handle("GetMedalWall", GetMedalWall);

ipcMain.on("ChangeMedal", (event, model_id) =>
  model_id ? ChangeMedal(model_id) : TakeOffModel(model_id)
);

ipcMain.handle("GetMusic", async (event, keyword) => {
  const match = /\[(\d{1,2}):([0-9.]{1,8})\](.*)\n?/g;
  const result = await GetMusic(keyword);
  for (const item of result) {
    if (item.lyric && match.test(item.lyric)) {
      const lyric = [];
      item.lyric.replace(match, (l, m, s, c) => {
        if (c && (!/:|：/.test(c) || lyric.length > 0)) {
          const t = item.tlyric.match(new RegExp(`\\[${m}:${s}\\](.*)\n?`));
          lyric.push({
            stamp: (+m * 60 + +s) * 1000,
            lyric: c.trim(),
            tlyric: t && t[1].trim(),
            start: `00:${m}:${s}`,
          });
        }
        return "";
      });
      item.stamps = lyric;
      item.language = match.test(item.tlyric) ? "双语" : "单语";
    }
  }
  return result.filter(({ stamps }) => stamps && stamps.length > 0);
});
