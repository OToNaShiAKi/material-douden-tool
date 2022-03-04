import { ipcMain, BrowserWindow } from "electron";
import {
  SendComment,
  Bilibili,
  GetWebSocket,
  GetMusic,
  SilentUser,
  Translate,
} from "./plugins/axios";
import { e } from "./plugins/utils";

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
  const result = (await GetMusic(keyword)).filter(
    ({ lyric }) => lyric && /\[\d{2}:[0-9\.]{6}\]/.test(lyric)
  );
  for (const item of result) {
    const lyric = [];
    item.lyric.replace(/\[(\d{2}):([0-9\.]{6})\](.*)\n?/g, (l, m, s, c) => {
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
    item.language = /\[\d{2}:[0-9\.]{6}\]/.test(item.tlyric) ? "双语" : "单语";
  }
  return result;
});

ipcMain.handle("SilentUser", SilentUser);

ipcMain.on("WindowSize", (event, height) => {
  const win = BrowserWindow.getAllWindows()[0];
  const [width] = win.getSize();
  win.setSize(width, height, true);
});

ipcMain.handle("CutWord", async (event, phrase) => {
  const sign = e(phrase);
  const text = await Translate(phrase, sign);
  return text;
});
