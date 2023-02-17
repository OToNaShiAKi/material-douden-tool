import axios from "axios";
import { BrowserWindow } from "electron";
import { AllWindows } from "../background";

const Response = (response) => response.data;

export const Bilibili = axios.create({
  baseURL: "https://api.live.bilibili.com/",
  withCredentials: true,
  headers: {
    origin: "https://live.bilibili.com",
    referer: "https://live.bilibili.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});
Bilibili.interceptors.response.use(({ data }) => {
  if (data.code !== 0 && data.code !== 1200000) {
    if (data.code === -111 && /csrf/gi.test(data.message)) {
      const win = BrowserWindow.fromId(AllWindows.index);
      win.webContents.send("CookieOverdue");
    }
    throw data;
  }
  data.data.message = data.message || data.msg;
  return data.data;
});

export const Login = axios.create({
  withCredentials: true,
  headers: {
    origin: "https://www.bilibili.com/",
    referer: "https://www.bilibili.com/",
    Cookie:
      "innersign=0; buvid3=96A61BF3-9872-AD90-2BDD-34A7E068E28323853infoc; i-wanna-go-back=-1; b_ut=7; b_lsid=1018D7EEE_1804B42FFA6; _uuid=58101102110-CAE7-71A1-EB13-D364E7E3E2F1023693infoc; buvid_fp=2c3cd32b4730cef2cdee3324f8c875be; buvid4=E1CB08DE-40C8-9D7B-36BB-54448369229626028-022042116-z1pJSbmBGD48zG9Xxm4xAw%3D%3D; PVID=1",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});
Login.interceptors.response.use(Response);
