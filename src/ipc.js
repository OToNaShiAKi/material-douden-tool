import { ipcMain } from "electron";
import { SendComment, ChangeCookie, Bilibili } from "./plugins/axios";

ipcMain.on(SendComment.name, SendComment);
ipcMain.on(ChangeCookie, (event, cookie, csrf) => {
  Bilibili.defaults.headers["Cookie"] = cookie;
  Bilibili.defaults.data = {
    csrf,
    csrf_token: csrf,
    rnd: Math.floor(Date.now() / 1000),
  };
});
