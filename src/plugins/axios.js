import axios from "axios";
import QS from "qs";
import { Bilibili, Music163, MusicQQ, Baidu, API, Login } from "./config";
import { BrowserWindow } from "electron";
import { AllWindows } from "../background";

export const SendComment = async (roomid, msg) => {
  try {
    return await Bilibili.post(
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
        medal: { up_medal },
        property: {
          danmu: { length = 20 },
        },
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
      ruid: up_medal && up_medal.uid,
      length,
    };
  } catch (error) {
    const win = BrowserWindow.fromId(AllWindows.index);
    win.webContents.send("CookieOverdue");
    return { host_list: [], comments: [], admin: false, roomid };
  }
};

export const SilentUser = async (event, tuid, room_id) => {
  try {
    return await Bilibili.post(
      "/xlive/web-ucenter/v1/banned/AddSilentUser",
      QS.stringify({
        room_id,
        tuid,
        mobile_app: "web",
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
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
    return await Bilibili.post(
      "/xlive/web-room/v1/dM/AjaxSetConfig",
      QS.stringify({
        room_id,
        color,
        mode,
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
  } catch (error) {
    return false;
  }
};

export const GetSilentUser = async (room_id) => {
  try {
    const { data } = await Bilibili.post(
      "/xlive/web-ucenter/v1/banned/GetSilentUserList",
      QS.stringify({
        room_id,
        ps: 1,
        visit_id: "",
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
    return data;
  } catch (error) {
    return [];
  }
};

export const RemoveSilentUser = async (event, id, roomid) => {
  try {
    return await Bilibili.post(
      "/banned_service/v1/Silent/del_room_block_user",
      QS.stringify({
        roomid,
        id,
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
        visit_id: "",
      })
    );
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
    } else {
      const {
        request: { path },
      } = await axios.get(key, {
        withCredentials: API.defaults.withCredentials,
        headers: API.defaults.headers,
      });
      return await GetVideoDurantion(path);
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
    return await Login.post("/qrcode/getLoginInfo", QS.stringify({ oauthKey }));
  } catch (error) {
    return { status: false, data: null };
  }
};

export const ClickRedPocket = async (ruid, room_id, lot_id) => {
  try {
    return await Bilibili.post(
      "/xlive/lottery-interface/v1/popularityRedPocket/RedPocketDraw",
      QS.stringify({
        ruid,
        room_id,
        lot_id,
        spm_id: "444.8.red_envelope.extract",
        jump_from: "",
        session_id: "",
        visit_id: "",
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
  } catch (error) {
    return false;
  }
};

export const GetTrackLiveInfo = async (event, room_id) => {
  try {
    const {
      live_time,
      live_status,
      playurl_info: {
        playurl: {
          g_qn_desc,
          stream: [
            {
              format: [
                {
                  format_name,
                  codec: [{ base_url, accept_qn, current_qn, url_info }],
                },
              ],
            },
          ],
        },
      },
    } = await Bilibili.get("/xlive/web-room/v2/index/getRoomPlayInfo", {
      params: {
        room_id,
        protocol: "0,1",
        format: "0,1,2",
        codec: "0,1",
        qn: 0,
        platform: "web",
        ptype: 8,
        dolby: 5,
      },
    });
    return {
      live_time,
      live_status,
      room_id,
      g_qn_desc,
      base_url,
      accept_qn,
      current_qn,
      url_info,
      format_name,
    };
  } catch (error) {
    return { room_id, live_status: 0 };
  }
};

export const MedalWall = async (event, target_id) => {
  try {
    const { list } = await Bilibili.get("/xlive/web-ucenter/user/MedalWall", {
      params: { target_id },
    });
    const result = [];
    for (const { medal_info } of list) {
      const roomid = await API.get("/x/space/acc/info", {
        params: { mid: medal_info.target_id },
      })
        .then(({ live_room: { roomid } }) => roomid)
        .catch(() => "");
      result.push({
        value: medal_info.medal_id,
        medal_name: medal_info.medal_name,
        wearing_status: medal_info.wearing_status,
        target_id: medal_info.target_id,
        roomid: `${roomid}`,
      });
    }
    return result;
  } catch (error) {
    return [];
  }
};

export const ChangeMedal = async (medal_id) => {
  try {
    return await Bilibili.post(
      "/xlive/app-ucenter/v1/fansMedal/wear",
      QS.stringify({
        medal_id,
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
  } catch (error) {
    return false;
  }
};

export const TakeOffModel = async (medal_id) => {
  try {
    return await Bilibili.post(
      "/xlive/app-ucenter/v1/fansMedal/take_off",
      QS.stringify({
        medal_id,
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
  } catch (error) {
    return false;
  }
};
