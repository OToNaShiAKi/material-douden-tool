import { BrowserWindow } from "electron";
import axios from "axios";

export const Bilibili = axios.create({
  baseURL: "https://api.live.bilibili.com/",
  widthCredentials: true,
  headers: {
    origin: "https://live.bilibili.com",
    referer: "https://live.bilibili.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});

Bilibili.interceptors.response.use((response) => {
  const {
    data,
    config: { url },
  } = response;
  if (data.code !== 0 && data.code !== 1200000) {
    if (!url.includes("send")) {
      const wins = BrowserWindow.getAllWindows();
      const win = wins[wins.length - 1];
      win.webContents.send("CookieOverdue");
    }
    throw data;
  }
  return data.data;
});

export const Music163 = axios.create({
  baseURL: "https://music.163.com/api/",
  widthCredentials: true,
  headers: {
    origin: "https://music.163.com",
    referer: "https://music.163.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});

Music163.interceptors.response.use((response) => response.data);

export const MusicQQ = axios.create({
  baseURL: "https://c.y.qq.com/",
  widthCredentials: true,
  headers: {
    origin: "https://y.qq.com",
    referer: "https://y.qq.com/portal/player.html",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});

MusicQQ.interceptors.response.use((response) => response.data);

export const Baidu = axios.create({
  baseURL: "https://fanyi.baidu.com/",
  widthCredentials: true,
  headers: {
    Cookie:
      "BAIDUID=7B8DB65FA1970FCBD48FE3DF075AEEA4:FG=1; Hm_lvt_64ecd82404c51e03dc91cb9e8c025574=1646374963; Hm_lpvt_64ecd82404c51e03dc91cb9e8c025574=1646374963; REALTIME_TRANS_SWITCH=1; FANYI_WORD_SWITCH=1; HISTORY_SWITCH=1; SOUND_SPD_SWITCH=1; SOUND_PREFER_SWITCH=1; APPGUIDE_10_0_2=1",
    origin: "https://fanyi.baidu.com/",
    referer: "https://fanyi.baidu.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});

Baidu.interceptors.response.use((response) => response.data);

export const API = axios.create({
  baseURL: "https://api.bilibili.com/",
  widthCredentials: true,
  headers: {
    // origin: "https://t.bilibili.com/",
    // referer: "https://t.bilibili.com/",
    Cookie:
      "innersign=0; buvid3=96A61BF3-9872-AD90-2BDD-34A7E068E28323853infoc; i-wanna-go-back=-1; b_ut=7; b_lsid=1018D7EEE_1804B42FFA6; _uuid=58101102110-CAE7-71A1-EB13-D364E7E3E2F1023693infoc; buvid_fp=2c3cd32b4730cef2cdee3324f8c875be; buvid4=E1CB08DE-40C8-9D7B-36BB-54448369229626028-022042116-z1pJSbmBGD48zG9Xxm4xAw%3D%3D; PVID=1",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});

API.interceptors.response.use((response) => response.data.data);
