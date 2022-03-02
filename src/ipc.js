import { ipcMain, BrowserWindow } from "electron";
import {
  SendComment,
  Bilibili,
  GetWebSocket,
  GetMusic,
  GetHistoryComment,
} from "./plugins/axios";
import { ChangeCookie } from "./store/mutations";

const Stacks = { RoomIds: [], timer: null };

ipcMain.on(SendComment.name, (event, msg, roomids) => {
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

ipcMain.on(ChangeCookie.name, (event, cookie, csrf) => {
  Bilibili.defaults.headers["Cookie"] = cookie;
  Bilibili.defaults.data = {
    csrf,
    csrf_token: csrf,
    rnd: Math.floor(Date.now() / 1000),
  };
});

ipcMain.handle(GetWebSocket.name, async (event, roomids) => {
  const promise = roomids.map(async (roomid) => {
    const [socket, comment] = await Promise.all([
      GetWebSocket(roomid),
      GetHistoryComment(roomid),
    ]);
    socket.comment = comment;
    socket.roomid = roomid;
    return socket;
  });
  return await Promise.all(promise);
});

ipcMain.handle(GetMusic.name, async (event, keyword) => {
  try {
    const result = (await GetMusic(keyword)).filter(
      ({ lyric }) => lyric && /\[\d{2}:[0-9\.]{6}\]/.test(lyric)
    );
    for (const item of result) {
      const lyric = [];
      item.lyric.replace(/\[(\d{2}):([0-9\.]{6})\](.*)\n?/g, (l, m, s, c) => {
        if (!/作词|作曲/.test(c) && c) {
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
      item.language = /\[\d{2}:[0-9\.]{6}\]/.test(item.tlyric)
        ? "双语轴"
        : "单语轴";
    }
    return result;
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on("WindowSize", (event, height) => {
  const win = BrowserWindow.getAllWindows()[0];
  const [width] = win.getSize();
  win.setSize(width, height, true);
});
