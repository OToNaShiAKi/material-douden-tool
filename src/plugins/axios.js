import axios from "axios";
import QS from "qs";

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
  if (response.data.code !== 0) throw response.data;
  return response.data.data;
});

const Music163 = axios.create({
  baseURL: "https://music.163.com/api/",
  widthCredentials: true,
  headers: {
    origin: "https://music.163.com",
    referer: "https://music.163.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});

Music163.interceptors.response.use((response) => {
  if (response.data.code !== 200) throw response.data;
  return response.data.result;
});

const MusicQQ = axios.create({
  baseURL: "https://c.y.qq.com/",
  widthCredentials: true,
  headers: {
    origin: "https://y.qq.com",
    referer: "https://y.qq.com/portal/player.html",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});

MusicQQ.interceptors.response.use((response) => {
  if (response.data.code !== 0) throw response.data;
  return response.data.data;
});

export const SendComment = async (roomid, msg) => {
  try {
    await Bilibili.post(
      "/msg/send",
      QS.stringify({
        roomid,
        msg,
        color: 1677215,
        mode: 1,
        bubble: 0,
        fontsize: 25,
        ...Bilibili.defaults.data,
      })
    );
  } catch (error) {
    console.log(error);
  }
};

export const GetWebSocket = async (roomid) => {
  try {
    const result = await Promise.all([
      Bilibili.get("/xlive/web-room/v1/index/getDanmuInfo", {
        params: { type: 0, id: roomid },
      }),
      Bilibili.get("/xlive/web-room/v1/dM/gethistory", {
        params: { roomid },
      }),
    ]);
    return {
      host_list: result[0].host_list,
      comments: result[1].room,
      roomid,
      token: result[0].token,
    };
  } catch (error) {
    console.log(error);
    return { roomid };
  }
};

export const GetMusic = async (event, keyword) => {
  try {
    const [song163, songQQ] = await Promise.all([
      Music163.get("/search/get/web", {
        params: { s: keyword, type: 1 },
      }),
      MusicQQ.get("/soso/fcgi-bin/client_search_cp", {
        params: { w: keyword, format: "json" },
      }),
    ]);
    return {
      songs: [...song163.songs, ...songQQ.song.list],
      total: song163.songCount + songQQ.song.totalnum,
    };
  } catch (error) {
    console.log(error);
  }
};
