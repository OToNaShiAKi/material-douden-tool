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

Bilibili.interceptors.request.use((config) => {
  config.data.csrf = Bilibili.defaults.data.csrf;
  config.data.csrf_token = Bilibili.defaults.data.csrf_token;
  config.data.rnd = Bilibili.defaults.data.rnd;
  return config;
});

Bilibili.interceptors.response.use((response) => {
  console.log(response);
  return response.data;
});

export const SendComment = async (event, roomids, msg) => {
  const send = roomids.map((roomid) =>
    Bilibili.post("/msg/send", {
      roomid,
      msg,
      color: 1677215,
      mode: 1,
      bubble: 0,
      fontsize: 25,
    })
  );
  try {
    const result = await Promise.all(send);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
};

export const ChangeCookie = "ChangeCookie";
