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

Music163.interceptors.response.use((response) => response.data);

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

MusicQQ.interceptors.response.use((response) => response.data);

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
    const result = await Bilibili.get("/xlive/web-room/v1/index/getDanmuInfo", {
      params: { type: 0, id: roomid },
    });
    return {
      host_list: result.host_list,
      token: result.token,
    };
  } catch (error) {
    return { roomid };
  }
};

export const GetHistoryComment = async (roomid) => {
  try {
    const result = await Bilibili.get("/xlive/web-room/v1/dM/gethistory", {
      params: { roomid },
    });
    return result.room.map(({ text, uid, nickname }) => ({
      text,
      uid,
      nickname,
    }));
  } catch (error) {
    return [];
  }
};

export const GetMusic = async (keyword) => {
  try {
    const [song163, songQQ] = await Promise.all([
      Music163.get("/search/get/web", {
        params: { s: keyword, type: 1 },
      }).then(
        async ({ result: { songs } }) =>
          await Promise.all(
            songs.map(async ({ name, artists, id }) => {
              const { lrc, tlyric } = await Music163.get("/song/lyric", {
                params: { id, lv: -1, tv: -1 },
              });
              return {
                id,
                name,
                lyric: lrc ? lrc.lyric : "",
                tlyric: tlyric ? tlyric.lyric : "",
                singer: artists.map(({ name }) => name).join("、"),
                origin: "网易云",
              };
            })
          )
      ),
      MusicQQ.get("/soso/fcgi-bin/client_search_cp", {
        params: { w: keyword, format: "json" },
      }).then(
        async ({
          data: {
            song: { list },
          },
        }) =>
          await Promise.all(
            list.map(async ({ songmid, songname, singer }) => {
              const { lyric = "", trans = "" } = await MusicQQ.get(
                "/lyric/fcgi-bin/fcg_query_lyric_new.fcg",
                { params: { songmid, nobase64: 1, g_tk: 5381, format: "json" } }
              );
              return {
                id: songmid,
                name: songname,
                lyric,
                tlyric: trans,
                singer: singer.map(({ name }) => name).join("、"),
                origin: "QQ",
              };
            })
          )
      ),
    ]);
    return [...song163, ...songQQ];
  } catch (error) {
    return [];
  }
};
