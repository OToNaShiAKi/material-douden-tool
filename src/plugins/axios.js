import axios from "axios";
import QS from "qs";
import { BrowserWindow } from "electron";

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
  if (response.data.code !== 0) {
    if (!response.config.url.includes("send")) {
      const [win] = BrowserWindow.getAllWindows();
      win.webContents.send("CookieOverdue");
    }
    throw response.data;
  }
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

const Baidu = axios.create({
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
    return error;
  }
};

export const GetWebSocket = async (roomid) => {
  try {
    const [
      socket,
      { room = [] },
      {
        badge: { is_room_admin = false },
        info: { uid = "" },
      },
    ] = await Promise.all([
      Bilibili.get("/xlive/web-room/v1/index/getDanmuInfo", {
        params: { type: 0, id: roomid },
      }),
      Bilibili.get("/xlive/web-room/v1/dM/gethistory", {
        params: { roomid },
      }),
      Bilibili.get("/xlive/web-room/v1/index/getInfoByUser", {
        params: { room_id: roomid },
      }),
    ]);
    return {
      host_list: socket.host_list,
      token: socket.token,
      comments: room.map(({ text, uid, nickname }) => ({
        info: text,
        uid,
        nickname,
      })),
      admin: is_room_admin,
      roomid,
      uid,
    };
  } catch (error) {
    return { host_list: [], comments: [], admin: false, roomid };
  }
};

export const SilentUser = async (event, tuid, room_id) => {
  try {
    await Bilibili.post(
      "/xlive/web-ucenter/v1/banned/AddSilentUser",
      QS.stringify({
        room_id,
        tuid,
        mobile_app: "web",
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const GetUserRoomMode = async (room_id) => {
  try {
    const [
      { group, mode },
      {
        property: { danmu },
      },
    ] = await Promise.all([
      Bilibili.get("/xlive/web-room/v1/dM/GetDMConfigByGroup", {
        params: { room_id },
      }),
      Bilibili.get("/xlive/web-room/v1/index/getInfoByUser", {
        params: { room_id },
      }),
    ]);
    return {
      colors: group,
      modes: mode,
      length: danmu.length,
      color: danmu.color.toString(16),
      mode: danmu.mode,
      roomid: room_id,
    };
  } catch (error) {
    return { colors: [], modes: [], roomid: room_id };
  }
};

export const SetUserRoomMode = async (event, room_id, color, mode) => {
  try {
    await Bilibili.post(
      "/xlive/web-room/v1/dM/AjaxSetConfig",
      QS.stringify({
        room_id,
        color,
        mode,
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
    return true;
  } catch (error) {
    return false;
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

export const Translate = async (query, sign) => {
  try {
    const { lan } = await Baidu.post("/langdetect", { query });
    if (lan !== "zh") {
      const result = await Baidu.post(`/v2transapi`, {
        from: lan,
        to: "zh",
        query,
        simple_means_flag: 3,
        sign,
        token: "46cfb720f37f680bbb084eb646578407",
        domain: "common",
      });
      return result.trans_result.data[0].dst;
    }
    return "";
  } catch (error) {
    return "";
  }
};
