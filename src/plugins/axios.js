import QS from "qs";
import { Bilibili, Music163, MusicQQ, Baidu, API, Login } from "./config";

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

export const GetSilentUser = async (room_id) => {
  try {
    const result = await Bilibili.post(
      "/xlive/web-ucenter/v1/banned/GetSilentUserList",
      QS.stringify({
        room_id,
        ps: 1,
        visit_id: "",
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
    return result.data;
  } catch (error) {
    return [];
  }
};

export const RemoveSilentUser = async (event, id, roomid) => {
  try {
    await Bilibili.post(
      "/banned_service/v1/Silent/del_room_block_user",
      QS.stringify({
        roomid,
        id,
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
        visit_id: "",
      })
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const GetMusic = async (keyword) => {
  const [song163, songQQ] = await Promise.all([
    Music163.get("/search/get/web", {
      params: { s: keyword, type: 1 },
    })
      .then(({ result: { songs } }) =>
        Promise.all(
          songs.map(({ name, artists, id }) =>
            Music163.get("/song/lyric", {
              params: { id, lv: -1, tv: -1 },
            })
              .then(({ lrc, tlyric }) => ({
                id,
                name,
                lyric: lrc ? lrc.lyric : "",
                tlyric: tlyric ? tlyric.lyric : "",
                singer: artists.map(({ name }) => name).join("、"),
                origin: "网易云",
              }))
              .catch(() => ({ lyric: "", tlyric: "" }))
          )
        )
      )
      .catch(() => []),
    MusicQQ.get("/soso/fcgi-bin/client_search_cp", {
      params: { w: keyword, format: "json" },
    })
      .then(
        ({
          data: {
            song: { list },
          },
        }) =>
          Promise.all(
            list.map(async ({ songmid, songname, singer }) =>
              MusicQQ.get("/lyric/fcgi-bin/fcg_query_lyric_new.fcg", {
                params: { songmid, nobase64: 1, g_tk: 5381, format: "json" },
              })
                .then(({ lyric = "", trans = "" }) => ({
                  id: songmid,
                  name: songname,
                  lyric,
                  tlyric: trans,
                  singer: singer.map(({ name }) => name).join("、"),
                  origin: "QQ",
                }))
                .catch(() => ({ lyric: "", tlyric: "" }))
            )
          )
      )
      .catch(() => []),
  ]);
  return [...song163, ...songQQ];
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

export const GetDynamic = async (id, next = 0) => {
  try {
    const {
      item: {
        basic: { comment_id_str, comment_type },
      },
    } = await API.get("/x/polymer/web-dynamic/v1/detail", {
      params: { id },
    });
    let result = [];
    do {
      const { cursor, replies } = await API.get("/x/v2/reply/main", {
        params: {
          next,
          type: comment_type,
          plat: 1,
          mode: 3,
          oid: comment_id_str,
        },
      });
      if (!replies) break;
      result = result.concat(replies);
      next = cursor.next;
    } while (true);
    return result;
  } catch (error) {
    return [];
  }
};

export const GetVideoDurantion = async (key) => {
  try {
    if (/BV.*/.test(key)) {
      const [{ duration }] = await API.get("/x/player/pagelist", {
        params: { bvid: key.match(/(BV[A-Za-z0-9_-]*)/)[0] },
      });
      return duration;
    }
  } catch (error) {
    return null;
  }
};

export const GetQRCode = async () => {
  try {
    const { data } = await Login.get("/qrcode/getLoginUrl");
    return data;
  } catch (error) {
    return { url: "", oauthKey: "" };
  }
};

export const GetLoginInfo = async (oauthKey) => {
  try {
    const result = await Login.post(
      "/qrcode/getLoginInfo",
      QS.stringify({ oauthKey })
    );
    return result;
  } catch (error) {
    return { status: false, data: null };
  }
};
