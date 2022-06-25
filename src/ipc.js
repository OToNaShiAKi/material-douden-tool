import { Bilibili, API } from "./plugins/config";
import createWindow, { AllWindows } from "./background";
import { e, Replies, FormatTime } from "./plugins/handle";
import { ipcMain, BrowserWindow, dialog, screen, app } from "electron";
import {
  SendComment,
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
} from "./plugins/axios";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const Stacks = {
  RoomIds: [],
  timer: null,
  interval: async () => {
    const roomid = Stacks.RoomIds.shift();
    if (roomid) {
      const { code, message } = await SendComment(roomid.id, roomid.msg);
      if (code === 10030) {
        clearInterval(Stacks.timer);
        Stacks.RoomIds.unshift(roomid);
        Stacks.timer = setInterval(Stacks.interval, 1750);
      } else if (message === "f") {
        const data = `屏蔽词：${roomid.msg} 房间：${
          roomid.id
        } 时间：${FormatTime(new Date())}\n`;
        const file = join(app.getPath("exe"), "../forbidden-words.txt");
        await writeFile(file, data, { flag: "a+" });
      }
    } else {
      clearInterval(Stacks.timer);
      Stacks.timer = null;
    }
  },
};

ipcMain.on("SendComment", (event, msg, roomids) => {
  Stacks.RoomIds = Stacks.RoomIds.concat(roomids.map((id) => ({ id, msg })));
  if (!Stacks.timer) {
    Stacks.interval();
    Stacks.timer = setInterval(Stacks.interval, 1000);
  }
});

ipcMain.on("ChangeCookie", (event, cookie, csrf) => {
  Bilibili.defaults.headers["Cookie"] = cookie;
  API.defaults.headers["Cookie"] = cookie;
  Bilibili.defaults.data = {
    csrf,
    csrf_token: csrf,
    rnd: Math.floor(Date.now() / 1000),
  };
});

ipcMain.handle("GetWebSocket", async (event, roomids) => {
  const promise = roomids.map(async (roomid) => {
    const room = await GetWebSocket(roomid);
    for (const w of room.comments) {
      const sign = e(w.info);
      const text = await Translate(w.info, sign);
      w.text = text;
    }
    return room;
  });
  return await Promise.all(promise);
});

ipcMain.handle("GetMusic", async (event, keyword) => {
  const match = /\[(\d{1,2}):([0-9.]{1,8})\](.*)\n?/g;
  const result = (await GetMusic(keyword)).filter(
    ({ lyric }) => lyric && match.test(lyric)
  );
  for (const item of result) {
    const lyric = [];
    item.lyric.replace(match, (l, m, s, c) => {
      if (c && (!/:|：/.test(c) || lyric.length > 0)) {
        const t = item.tlyric.match(new RegExp(`\\[${m}:${s}\\](.*)\n?`));
        lyric.push({
          stamp: (+m * 60 + +s) * 1000,
          lyric: c.trim(),
          tlyric: t && t[1].trim(),
        });
      }
      return "";
    });
    item.stamp = lyric;
    item.language = match.test(item.tlyric) ? "双语" : "单语";
  }
  return result;
});

ipcMain.handle("SilentUser", SilentUser);

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

ipcMain.handle("GetSilentUser", async (event, roomids) => {
  const result = await Promise.all(roomids.map((v) => GetSilentUser(v.value)));
  let slients = [];
  for (let i = 0; i < result.length; i++) {
    slients = slients.concat(
      result[i].map(({ tname, tuid, id }) => ({
        tname,
        tuid,
        id,
        ...roomids[i],
      }))
    );
  }
  return slients;
});

ipcMain.handle("RemoveSilentUser", RemoveSilentUser);

ipcMain.on("WindowSize", (event, height) => {
  const win = BrowserWindow.fromId(AllWindows.index);
  const [width] = win.getSize();
  win.setSize(width, height, true);
});

ipcMain.handle("CutWord", async (event, phrase) => {
  const sign = e(phrase);
  const text = await Translate(phrase, sign);
  return text;
});

ipcMain.on("OtherWindow", async (event, page, DevTools = false) => {
  let win = AllWindows.other && BrowserWindow.fromId(AllWindows.other);
  if (win && DevTools) {
    win.webContents.openDevTools();
  } else if (!win) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    win = await createWindow(page, {
      width,
      height,
      x: 0,
      y: 0,
      alwaysOnTop: false,
    });
  }
});

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

ipcMain.handle("GetDynamic", async (event, ids) => {
  ids = ids.map(async (v) => await Replies(await GetDynamic(v, 0)));
  const result = await Promise.all(ids);
  return result.flat(1);
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

ipcMain.handle("ClickRedPocket", async (event, ...ids) => {
  clearInterval(Stacks.timer);
  const result = await ClickRedPocket(...ids);
  Stacks.timer = setInterval(Stacks.interval, 1000);
  return result;
});

ipcMain.handle("TrackLive", GetTrackLiveInfo);

ipcMain.on("Live", (event, roomid) => {
  const win = AllWindows.other && BrowserWindow.fromId(AllWindows.other);
  win && win.webContents.send("Live", roomid);
});
