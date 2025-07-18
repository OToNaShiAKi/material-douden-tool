import { API, Bilibili, Login } from "./plugins/headers";
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
  SearchMusic,
  SilentUser,
  GetLiveInfo,
  GetSilentUser,
  RemoveSilentUser,
  GetUserRoomInfo,
  GetDynamic,
  LoginStatistics,
  PubShield,
  SubShield,
  AddRoomTrace,
} from "./plugins/axios";
import { folder, Stacks } from "./util/Stacks";
import { writeFile, mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import { join, extname } from "path";
import { Replies } from "./util/Replies";
import FontList from "font-list";
import MD5 from "blueimp-md5";
import OS from "os";
import Package from "../package.json";
import { Ships } from "./util/Verify";
import { GetWBI } from "./util/wbi";

const options = {
  alwaysOnTop: false,
  frame: true,
  titleBarStyle: "default",
  transparent: false,
};

ipcMain.on("WindowSize", (event, height) => {
  const win = BrowserWindow.fromId(AllWindows.get("index"));
  const [width] = win.getSize();
  win.setSize(width, height, true);
});

ipcMain.on("OtherWindow", async (event, page, DevTools = false) => {
  let win = AllWindows.has(page) && BrowserWindow.fromId(AllWindows.get(page));
  if (win && DevTools) {
    win.webContents.openDevTools();
  } else if (!win) {
    const size = screen.getPrimaryDisplay().workAreaSize;
    win = await CreateWindow(page, { ...size, ...options });
  }
});

ipcMain.on("Channel", async (event, channel, data, create = false) => {
  let win =
    AllWindows.has("support") &&
    BrowserWindow.fromId(AllWindows.get("support"));
  if (!win && create) {
    const size = screen.getPrimaryDisplay().workAreaSize;
    win = await CreateWindow("support", { ...size, ...options });
  }
  win && win.webContents.send(channel, data);
});

ipcMain.on("SendComment", (event, message, roomid) => {
  Stacks.Messages.push({ message, id: roomid });
  if (!Stacks.timer) {
    Stacks.interval();
    Stacks.timer = setInterval(Stacks.interval, 1000);
  }
});

ipcMain.handle("BilibiliLogin", async () => {
  const { url, qrcode_key } = await GetQRCode();
  const timer = setInterval(async () => {
    const { code, url: data } = await GetLoginInfo(qrcode_key);
    if (code === 0 || code === 86038) {
      clearInterval(timer);
      const query = data
        .slice(data.indexOf("?") + 1)
        .replace(/\?/g, "")
        .replace(/&/g, ";");
      const win = BrowserWindow.fromId(AllWindows.get("index"));
      win.webContents.send("Login", { status: true, data, query });
    }
  }, 3000);
  if (!(url && qrcode_key)) clearInterval(timer);
  return url;
});

ipcMain.handle("Cookie", async (event, cookie, csrf, use = true) => {
  Bilibili.defaults.headers.Cookie = cookie;
  Login.defaults.headers.Cookie = cookie;
  Bilibili.defaults.data = {
    csrf,
    csrf_token: csrf,
    rnd: Math.floor(Date.now() / 1000),
  };
  const result = await CheckLogin();
  Bilibili.defaults.headers.Cookie += result.cookie;
  Bilibili.defaults.data.wbi = GetWBI(result.wbi.img_url, result.wbi.sub_url);
  if (result.mid) {
    const hostname = `${OS.platform().toUpperCase()}:${OS.hostname()}`;
    const crypto = MD5(`${result.mid}.${hostname}.${csrf}`);
    API.defaults.headers.Cookie = `mid=${result.mid}; hostname=${hostname}; crypto=${crypto};`;
    result.sponsor = await LoginStatistics(
      result.name,
      result.avatar,
      csrf,
      Package.version
    );
    result.shields = await SubShield(use);
  }
  return result;
});

ipcMain.handle("SearchLive", async (event, keyword) => {
  const match = /^\d+$/.test(keyword);
  let [{ live_user = [] }, uid] = await Promise.all([
    SearchLive(keyword),
    match && SearchUser(keyword),
  ]);
  live_user = live_user || [];
  live_user = live_user.map((item) => ({
    uid: item.uid.toString(),
    value: item.roomid.toString(),
    name: item.uname,
    text: item.uname.replace(/<em class="keyword">|<\/em>/g, ""),
    avatar: /https:/.test(item.uface) ? item.uface : `https:${item.uface}`,
    live_status: item.is_live,
    follower: item.attentions,
  }));
  uid && live_user.unshift(uid);
  return live_user;
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
  const result = await SearchMusic(keyword);
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
  const promise = roomids.map(async ({ roomid }) => {
    const socket = await GetWebSocket(roomid);
    socket.comments = socket.comments.map((item) => {
      if (item.emoticon.text) {
        item.text = `<img src="${item.emoticon.url}" height="20" />`;
      }
      if (item.user.medal && item.user.medal.guard_level > 0) {
        const url = Ships[item.user.medal.guard_level];
        item.nickname =
          `<img src="${url}" width="20" height="20" />` + item.nickname;
      }
      if (item.emots) {
        const regexp = Object.keys(item.emots)
          .join("|")
          .replace(/\[|\]/g, (s) => "\\" + s);
        item.text = item.text.replace(new RegExp(regexp, "ig"), (s) => {
          const { url } = item.emots[s];
          return `<img src="${url}" width="20" height="20" />`;
        });
      }
      return {
        id: "HISTORY-" + item.rnd,
        message: item.text,
        uid: item.uid,
        name: item.nickname,
        admin: item.isadmin || socket.uid == item.uid,
      };
    });
    return socket;
  });
  AddRoomTrace(roomids);
  return await Promise.all(promise);
});

ipcMain.handle("SilentUser", SilentUser);

ipcMain.handle("TrackLive", (event, roomid, qn = 0) => GetLiveInfo(roomid, qn));

ipcMain.on("SaveFiles", async (event, Datas, name, encoding = "buffer") => {
  const ext = extname(name);
  const isArray = Array.isArray(Datas);
  name = isArray ? name.replace(ext, "") : name;
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: name,
    filters: [{ name: "All Files", extensions: ["*"] }],
    title: isArray ? "保存文件夹" : "保存文件",
  });
  if (filePath) {
    if (isArray) {
      await mkdir(filePath);
      for (let i = 0; i < Datas.length; i++) {
        await writeFile(join(filePath, `./${name}-${i}${ext}`), Datas[i], {
          encoding,
        });
      }
    } else {
      await writeFile(filePath, Datas, { encoding });
    }
  }
});

ipcMain.handle("GetSilentUser", async (event, roomids) => {
  const result = await Promise.all(roomids.map((v) => GetSilentUser(v.value)));
  let slients = [];
  for (let i = 0; i < result.length; i++) {
    result[i] = result[i].map((item) => ({
      tname: item.tname,
      tuid: item.tuid,
      id: item.id,
      ctime: item.ctime,
      executor: item.name,
      ...roomids[i],
    }));
    slients = slients.concat(result[i]);
  }
  return slients;
});

ipcMain.handle("RemoveSilentUser", RemoveSilentUser);

ipcMain.handle("GetUserRoomInfo", async (event, roomids) => {
  const result = await Promise.all(
    roomids.map((v) => GetUserRoomInfo(v.value))
  );
  return result;
});

ipcMain.handle("SearchUser", async (event, keyword) => {
  const match = /^\d+$/.test(keyword);
  let [search = [], uid] = await Promise.all([
    SearchLive(keyword, "bili_user"),
    match && SearchUser(keyword),
  ]);
  search = search || [];
  search = search.map((item) => ({
    uid: item.mid.toString(),
    value: item.room_id.toString(),
    text: item.uname,
    avatar: /https:/.test(item.upic) ? item.upic : `https:${item.upic}`,
    follower: item.fans,
  }));
  uid && search.unshift(uid);
  return search;
});

ipcMain.handle("GetDynamic", async (event, ids) => {
  ids = ids.map(async (v) => await Replies(await GetDynamic(v, 0)));
  const result = await Promise.all(ids);
  return result.flat(1);
});

ipcMain.handle("GetFont", async (event) => {
  const result = await FontList.getFonts();
  return result.map((item) => item.replace(/^"|"$/g, ""));
});

ipcMain.on("PubShield", PubShield);

ipcMain.handle("SubShield", (event, use = true) => SubShield(use));

export const streams = new Map();

ipcMain.on("WriteComment", (event, roomid, start, comment) => {
  let stream = null;
  if (!streams.has(roomid)) {
    const date = new Date(start).toJSON().replace(/\:/gi, "-");
    const filename = join(folder, `./[${roomid}]${date}.log`);
    stream = createWriteStream(filename, {
      flags: "a",
      encoding: "utf8",
    });
    streams.set(roomid, stream);
  }
  stream = streams.get(roomid);
  comment.time = new Date(comment.time).toLocaleString("zh-cn", {
    timeStyle: "medium",
    dateStyle: "short",
    hourCycle: "h24",
  });
  const text = `${comment.time} [${comment.config}] (UID)${comment.uid} ${comment.loginfo}\n`;
  if (stream.can === false) {
    stream.once("drain", () => (stream.can = stream.write(text)));
    return;
  }
  stream.can = stream.write(text);
});
