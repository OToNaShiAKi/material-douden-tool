import { ipcMain, BrowserWindow } from "electron";
import {
  SendComment,
  Bilibili,
  GetWebSocket,
  GetMusic,
  SilentUser,
  Translate,
  GetUserRoomMode,
  SetUserRoomMode,
  GetSilentUser,
  RemoveSilentUser,
} from "./plugins/axios";
import { e } from "./plugins/utils";
import { writeFile, mkdir, stat } from "fs/promises";
import createWindow from "./background";
import { join } from "path";

const Stacks = { RoomIds: [], timer: null };

ipcMain.on("SendComment", (event, msg, roomids) => {
  if (!Stacks.timer) {
    SendComment(roomids.shift(), msg);
    Stacks.timer = setInterval(() => {
      const roomid = Stacks.RoomIds.shift();
      if (roomid) SendComment(roomid.id, roomid.msg);
      else {
        clearInterval(Stacks.timer);
        Stacks.timer = null;
      }
    }, 1000);
  }
  Stacks.RoomIds = Stacks.RoomIds.concat(roomids.map((v) => ({ id: v, msg })));
});

ipcMain.on("ChangeCookie", (event, cookie, csrf) => {
  Bilibili.defaults.headers["Cookie"] = cookie;
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
  const match = /\[(\d{1,2}):([0-9\.]{1,6})\](.*)\n?/g;
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
  const wins = BrowserWindow.getAllWindows();
  const win = wins[wins.length - 1];
  const [width] = win.getSize();
  win.setSize(width, height, true);
});

ipcMain.handle("CutWord", async (event, phrase) => {
  const sign = e(phrase);
  const text = await Translate(phrase, sign);
  return text;
});

ipcMain.on("OtherWindow", (event, page) => {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length < 2)
    createWindow(page, { width: 1500, height: 1080, alwaysOnTop: false });
});

ipcMain.on("SaveImage", async (event, Base64) => {
  const time = Date.now();
  const folder = join(__dirname, "./images");
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, `${time}.png`), Base64, { encoding: "base64" });
});
