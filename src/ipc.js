import { ipcMain } from "electron";
import { SendComment, Bilibili } from "./plugins/axios";
import { ChangeCookie } from "./store/mutations";

const Stacks = {
  RoomIds: [],
  timer: null,
};

ipcMain.on(SendComment.name, (event, roomids, msg) => {
  if (Stacks.timer) {
    Stacks.RoomIds = Stacks.RoomIds.concat(roomids);
  } else {
    SendComment(roomids.shift(), msg);
    Stacks.RoomIds = Stacks.RoomIds.concat(roomids);
    Stacks.timer = setInterval(() => {
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
