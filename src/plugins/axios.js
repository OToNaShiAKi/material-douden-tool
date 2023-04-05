import { Baidu, Bilibili, Login, Music, API } from "./headers.js";
import QS from "qs";
import { BrowserWindow } from "electron";
import { AllWindows } from "../background";
import axios from "axios";

export const GetUserRoomInfo = async (room_id) => {
  try {
    const {
      badge: { is_room_admin = false },
      info: { uid = "" },
      property: { danmu },
    } = await Bilibili.get("/xlive/web-room/v1/index/getInfoByUser", {
      params: { room_id },
    });
    return { admin: is_room_admin, uid, danmu, roomid: room_id };
  } catch (error) {
    return { roomid: room_id };
  }
};

const GetFollow = async (vmid) => {
  try {
    const { follower } = await Bilibili.get("/x/relation/stat", {
      params: { vmid },
      baseURL: "https://api.bilibili.com/",
    });
    return follower;
  } catch (error) {
    return null;
  }
};

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

export const GetLiveInfo = async (roomid) => {
  try {
    const { live_time, live_status, uid, playurl_info } = await Bilibili.get(
      "/xlive/web-room/v2/index/getRoomPlayInfo",
      {
        params: {
          room_id: roomid,
          protocol: "0,1",
          format: "0,1,2",
          codec: "0,1",
          qn: 0,
          platform: "web",
          ptype: 8,
          dolby: 5,
        },
      }
    );
    const result = { live_time, live_status, roomid, uid };
    if (playurl_info) {
      const {
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
      } = playurl_info;
      result.g_qn_desc = g_qn_desc;
      result.base_url = base_url;
      result.accept_qn = accept_qn;
      result.current_qn = current_qn;
      result.url_info = url_info;
      result.format_name = format_name;
    }
    return result;
  } catch (error) {
    return { roomid, live_status: 0, code: error.code };
  }
};

export const SearchLive = async (keyword, type = "live") => {
  try {
    const { result } = await Bilibili.get("/x/web-interface/wbi/search/type", {
      baseURL: "https://api.bilibili.com/",
      params: {
        order: "online",
        platform: "pc",
        keyword,
        search_type: type,
        source_tag: 3,
        highlight: 1,
      },
    });
    return result;
  } catch (error) {
    return [];
  }
};

export const SearchUser = async (mid) => {
  try {
    const data = await Bilibili.get("/x/space/wbi/acc/info", {
      params: { mid, platform: "web" },
      baseURL: "https://api.bilibili.com/",
    });
    const result = {
      uid: data.mid.toString(),
      value: data.live_room.roomid.toString(),
      text: data.name,
      avatar: /https:/.test(data.face) ? data.face : `https:${data.face}`,
      live_status: data.live_room.liveStatus,
    };
    result.follower = await GetFollow(data.mid);
    return result;
  } catch (error) {
    return null;
  }
};

export const GetUserRoomMode = async (room_id) => {
  try {
    const [{ group, mode }, { danmu }] = await Promise.all([
      Bilibili.get("/xlive/web-room/v1/dM/GetDMConfigByGroup", {
        params: { room_id },
      }),
      GetUserRoomInfo(room_id),
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

export const GetMedalWall = async (event, target_id) => {
  try {
    const { list } = await Bilibili.get("/xlive/web-ucenter/user/MedalWall", {
      params: { target_id },
    });
    return list.map(({ medal_info, target_icon }) => ({
      value: medal_info.medal_id.toString(),
      medal_name: medal_info.medal_name,
      wearing_status: medal_info.wearing_status,
      target_id: medal_info.target_id.toString(),
      avatar: target_icon,
      level: medal_info.level,
      color: "#" + medal_info.medal_color_border.toString(16),
    }));
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

export const GetFollowLive = async () => {
  try {
    const {
      live_users: { items = [] },
    } = await Bilibili.get("/x/polymer/web-dynamic/v1/portal", {
      baseURL: "https://api.bilibili.com/",
    });
    return await Promise.all(
      items.map(async (item) => ({
        uid: item.mid.toString(),
        value: item.room_id.toString(),
        text: item.uname,
        avatar: item.face,
        live_status: 1,
        follower: await GetFollow(item.mid),
      }))
    );
  } catch (error) {
    return [];
  }
};

const GetMusicLyric = async (id) => {
  try {
    const { lrc, tlyric, yrc, ytlrc } = await Music.get("/song/lyric", {
      params: { id, lv: 1, tv: 1, yv: 1, ytv: 1 },
    });
    return {
      lyric: lrc ? lrc.lyric : "",
      tlyric: tlyric ? tlyric.lyric : "",
      ylyric: yrc ? yrc.lyric : "",
      ytlyric: ytlrc ? ytlrc.lyric : "",
    };
  } catch (error) {
    return { lyric: "", tlyric: "" };
  }
};

export const SearchMusic = async (keyword) => {
  try {
    let {
      result: { songs },
    } = await Music.get("/cloudsearch/pc", {
      params: { s: keyword, type: 1, limit: 20 },
    });
    songs = songs.map(async ({ name, ar, id, dt, al }) => {
      const lyric = await GetMusicLyric(id);
      return {
        id: `${al.id}-${id}`,
        name,
        ...lyric,
        singer: ar.map(({ name }) => name).join("/"),
        origin: "163",
        duration: dt,
        avatar: al.picUrl,
      };
    });
    return await Promise.all(songs);
  } catch (error) {
    return [];
  }
};

export const CheckLogin = async () => {
  try {
    const { face, uname, mid } = await Bilibili.get("/x/web-interface/nav", {
      baseURL: "https://api.bilibili.com/",
    });
    return { avatar: face, name: uname, mid };
  } catch (error) {
    const win = BrowserWindow.fromId(AllWindows.index);
    win.webContents.send("CookieOverdue");
    return { mid: null };
  }
};

export const GetWebSocket = async (roomid) => {
  try {
    const [
      { host_list = [], token },
      { room = [] },
      {
        admin,
        uid,
        danmu: { length = 20 },
      },
      { uid: ruid },
    ] = await Promise.all([
      Bilibili.get("/xlive/web-room/v1/index/getDanmuInfo", {
        params: { type: 0, id: roomid },
      }),
      Bilibili.get("/xlive/web-room/v1/dM/gethistory", {
        params: { roomid },
      }),
      GetUserRoomInfo(roomid),
      GetLiveInfo(roomid),
    ]);
    const host = host_list[host_list.length - 1];
    return {
      host: `wss://${host.host}:${host.wss_port}/sub`,
      token,
      comments: room.map((item) => ({
        id: "HISTORY-" + item.rnd,
        message: item.text,
        uid: item.uid,
        name: item.nickname,
        admin: item.isadmin || uid == item.uid,
      })),
      admin: admin || uid == ruid,
      roomid,
      uid,
      ruid,
      length,
    };
  } catch (error) {
    return { host: "", comments: [], admin: false, roomid };
  }
};

export const SilentUser = async (event, tuid, room_id, msg) => {
  try {
    return await Bilibili.post(
      "/xlive/web-ucenter/v1/banned/AddSilentUser",
      QS.stringify({
        room_id,
        tuid,
        mobile_app: "web",
        msg,
        csrf: Bilibili.defaults.data.csrf,
        csrf_token: Bilibili.defaults.data.csrf_token,
      })
    );
  } catch (error) {
    return false;
  }
};

export const GetAuthen = async () => {
  try {
    const { headers } = await axios.get("https://fanyi.baidu.com");
    let Cookie = headers["set-cookie"]
      .map((item) => item.split(";")[0])
      .join("; ");
    const result = await axios.get("https://fanyi.baidu.com", {
      headers: { ...Baidu.defaults.headers, Cookie },
      withCredentials: true,
    });
    if (result.headers["set-cookie"]) {
      Cookie += "; ";
      Cookie += result.headers["set-cookie"]
        .map((item) => item.split(";")[0])
        .join(";");
    }
    const match = result.data.match(/token: ?'(.*)'/);
    return { Cookie, token: match[1] };
  } catch (error) {
    return { Cookie: null, token: null };
  }
};

export const Translate = async (query, sign, to = "zh") => {
  try {
    const { lan } = await Baidu.post("/langdetect", { query });
    if (lan !== to) {
      const {
        trans_result: {
          data: [{ dst }],
        },
      } = await Baidu.post("/v2transapi", {
        from: lan,
        to,
        query,
        transtype: "realtime",
        simple_means_flag: 3,
        sign,
        token: Translate.token,
        domain: "common",
      });
      return dst;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const GetSilentUser = async (room_id) => {
  let result = [];
  try {
    let ps = 1;
    do {
      const { data, total_page } = await Bilibili.post(
        "/xlive/web-ucenter/v1/banned/GetSilentUserList",
        QS.stringify({
          room_id,
          ps,
          visit_id: "",
          csrf: Bilibili.defaults.data.csrf,
          csrf_token: Bilibili.defaults.data.csrf_token,
        })
      );
      result = result.concat(data);
      ps += 1;
      if (ps > total_page) break;
    } while (true);
    return result;
  } catch (error) {
    return result;
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

export const GetDynamic = async (id, next = 0) => {
  try {
    const {
      item: {
        basic: { comment_id_str, comment_type },
      },
    } = await Bilibili.get("/x/polymer/web-dynamic/v1/detail", {
      baseURL: "https://api.bilibili.com/",
      params: { id, timezone_offset: -480 },
    });
    let result = [];
    do {
      const { cursor, replies } = await Bilibili.get("/x/v2/reply/main", {
        baseURL: "https://api.bilibili.com/",
        params: {
          next,
          type: comment_type,
          plat: 1,
          mode: 3,
          oid: comment_id_str,
        },
      });
      if (!replies || replies.length <= 0) break;
      result = result.concat(replies);
      next = cursor.next;
    } while (true);
    return result;
  } catch (error) {
    return [];
  }
};

export const GetVideoInfo = async (key) => {
  try {
    if (/(BV[A-Za-z0-9_-]*)|(av[0-9]*)/gi.test(key)) {
      const bvid = key.match(/(BV[A-Za-z0-9_-]*)/);
      const aid = key.match(/av([0-9]*)/);
      const { duration, pic } = await Bilibili.get("/x/web-interface/view", {
        baseURL: "https://api.bilibili.com/",
        params: { bvid: bvid && bvid[0], aid: aid && aid[1] },
      });
      return { duration, avatar: pic };
    } else {
      const {
        request: { path },
      } = await axios.get(key, {
        withCredentials: true,
        headers: Bilibili.defaults.headers,
      });
      return await GetVideoInfo(path);
    }
  } catch (error) {
    return { duration: null, avatar: "" };
  }
};

export const LoginStatistics = async (name, avatar, jct, version) => {
  try {
    const { sponsor = 0 } = await API.post("/alogin", {
      name,
      avatar,
      jct,
      version,
    });
    return sponsor > 0;
  } catch (error) {
    return false;
  }
};

export const PubShield = async (event, shield, handle, operation = true) => {
  try {
    return await API.post("/app/add-words", {
      shield,
      handle,
      operation,
    });
  } catch (error) {
    return false;
  }
};

export const SubShield = async (use = true) => {
  try {
    const result = await API.post("/app/get-words", { use });
    return result || [];
  } catch (error) {
    return [];
  }
};
