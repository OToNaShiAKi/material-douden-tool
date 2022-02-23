import { ipcMain } from "electron";
import {
  SendComment,
  Bilibili,
  GetWebSocket,
  GetMusic,
  GetHistoryComment,
} from "./plugins/axios";
import { ChangeCookie } from "./store/mutations";

const Stacks = { RoomIds: [], timer: null };

ipcMain.on(SendComment.name, (event, roomids, msg) => {
  if (Stacks.timer) {
    Stacks.RoomIds = Stacks.RoomIds.concat(roomids);
  } else {
    SendComment(roomids.shift(), msg);
    Stacks.RoomIds = Stacks.RoomIds.concat(roomids);
    Stacks.timer = setInterval(() => {
      console.log(Stacks, msg);
      const roomid = Stacks.RoomIds.shift();
      if (roomid) {
        SendComment(roomid, msg);
      }
      if (Stacks.RoomIds.length <= 0) {
        clearInterval(Stacks.timer);
        Stacks.timer = null;
      }
    }, 750);
  }
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
  const result = await GetMusic(keyword);
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
  }
  return result;
});
