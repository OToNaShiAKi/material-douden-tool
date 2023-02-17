import { Bilibili, Login } from "./plugins/headers";
import CreateWindow, { AllWindows } from "./background";
// import { e, Replies } from "./plugins/handle";
import { ipcMain, BrowserWindow, dialog, screen, app } from "electron";
import {
  GetWebSocket,
  GetMusic,
  SilentUser,
  Translate,
  GetUserRoomMode,
  SetUserRoomMode,
  GetSilentUser,
  RemoveSilentUser,
  GetDynamic,
  GetQRCode,
  GetLoginInfo,
  ClickRedPocket,
  GetTrackLiveInfo,
  MedalWall,
  ChangeMedal,
  TakeOffModel,
} from "./plugins/axios";
// import { writeFile, mkdir } from "fs/promises";
// import { join } from "path";
import { Stacks } from "./util/server";
// import FontList from "font-list";

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
    win = await CreateWindow(page, {
      ...size,
      alwaysOnTop: false,
      frame: true,
      titleBarStyle: "default",
      transparent: false,
    });
  }
});

ipcMain.on("Channel", async (event, channel, ...data) => {
  const win = AllWindows.support && BrowserWindow.fromId(AllWindows.support);
  win && win.webContents.send(channel, ...data);
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
