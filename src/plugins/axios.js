import axios from "axios";

const Bilibili = axios.create({
  baseURL: "https://api.live.bilibili.com/",
  widthCredentials: true,
  headers: {
    origin: "https://live.bilibili.com",
    referer: "https://live.bilibili.com",
    Cookie:
      "buvid3=270E286A-D309-4AE0-AF8F-6B72A049D6A7148830infoc;SESSDATA=85a5a9d8%2C1656407117%2C63138%2Ac1;bili_jct=996cb2df77454c1fdb3aa4b5fb81dd16",
  },
});

export const SendContent = async (roomids, msg) => {
  for (const roomid of roomids) {
    try {
      const result = await Bilibili.post("/msg/send", { roomid, msg });
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  }
};
