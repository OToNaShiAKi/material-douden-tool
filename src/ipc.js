import { Baidu, Bilibili, Login } from "./plugins/headers";
import CreateWindow, { AllWindows } from "./background";
import { ipcMain, BrowserWindow, dialog, screen } from "electron";
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
  CheckLogin,
  GetWebSocket,
  SearchMusic163,
  SearchMusicQQ,
  SilentUser,
  GetAuthen,
  Translate,
  GetLiveInfo,
} from "./plugins/axios";
import { e, Stacks, TranslateResult } from "./util/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

ipcMain.handle("Cookie", async (event, cookie, csrf) => {
  Bilibili.defaults.headers["Cookie"] = cookie;
  Login.defaults.headers["Cookie"] = cookie;
  Bilibili.defaults.data = {
    csrf,
    csrf_token: csrf,
    rnd: Math.floor(Date.now() / 1000),
  };
  return await CheckLogin();
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
  const [music163, musicQQ] = await Promise.all([
    SearchMusic163(keyword),
    SearchMusicQQ(keyword),
  ]);
  const result = [...music163, ...musicQQ];
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

ipcMain.handle("GetWebSocket", async (event, roomids) => {
  const promise = roomids.map((roomid) => GetWebSocket(roomid));
  return await Promise.all(promise);
});

ipcMain.handle("SilentUser", SilentUser);

ipcMain.handle("Translate", async (event, phrase, to = "zh") => {
  const sign = e(phrase),
    key = `${sign}-${to}`;
  if (TranslateResult[key]) return TranslateResult[key];
  if (!Baidu.defaults.headers.Cookie) {
    const { Cookie, token } = await GetAuthen();
    Baidu.defaults.headers.Cookie = Cookie;
    Translate.token = token;
  }
  const result = await Translate(phrase, sign, to);
  TranslateResult[key] = result;
  return result;
});

ipcMain.handle("TrackLive", (event, roomid) => GetLiveInfo(roomid));

ipcMain.on("SaveFiles", async (event, Datas, name, encoding = "buffer") => {
  const isArray = Array.isArray(Datas);
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: name,
    filters: [{ name: "All Files", extensions: ["*"] }],
    title: isArray ? "保存文件夹" : "保存文件",
  });
  if (filePath) {
    if (isArray) {
      await mkdir(filePath);
      for (let i = 0; i < Datas.length; i++) {
        writeFile(join(filePath, `./${name}-${i}.png`), Datas[i], {
          encoding,
        });
      }
    } else {
      writeFile(filePath, Datas, { encoding });
    }
  }
});
