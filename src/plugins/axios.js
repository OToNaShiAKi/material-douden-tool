import { Bilibili, Login, Music, API } from "./headers.js";
import QS from "qs";
import { BrowserWindow } from "electron";
import { AllWindows } from "../background";
import axios from "axios";
import { GetRID } from "../util/wbi.js";

const VideoIcons = Object.freeze({
  30000: "mdi-dolby",
  20000: "mdi-video-4k-box",
  10000: "mdi-video-box",
  400: "mdi-compare",
  250: "mdi-quality-high",
  150: "mdi-quality-medium",
  80: "mdi-quality-low",
});

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
    const { data } = await Login.get("/x/passport-login/web/qrcode/generate", {
      params: { source: "main-fe-header" },
    });
    return data;
  } catch (error) {
    return { url: "", oauthKey: "" };
  }
};

export const GetLoginInfo = async (qrcode_key) => {
  try {
    const { data } = await Login.get("/x/passport-login/web/qrcode/poll", {
      params: { qrcode_key, source: "main-fe-header" },
    });
    return data;
  } catch (error) {
    return { status: false, data: null };
  }
};

export const GetLiveInfo = async (roomid, qn = 0) => {
  try {
    const { live_time, live_status, uid, playurl_info } = await Bilibili.get(
      "/xlive/web-room/v2/index/getRoomPlayInfo",
      {
        params: {
          room_id: roomid,
          protocol: "0,1",
          format: "0,1,2",
          codec: "0,1",
          qn,
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
      result.accept_qn = g_qn_desc
        .filter(({ qn }) => accept_qn.includes(qn))
        .map(({ qn, desc }) => ({
          icon: VideoIcons[qn],
          value: qn,
          text: desc,
        }));
      result.base_url = base_url;
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
    const params = { mid, platform: "web", token: "", web_location: 1550101 };
    const data = await Bilibili.get("/x/space/wbi/acc/info", {
      params: GetRID(params, Bilibili.defaults.data.wbi),
      baseURL: "https://api.bilibili.com/",
    });
    const result = {
      uid: data.mid.toString(),
      text: data.name,
      avatar: /https:/.test(data.face) ? data.face : `https:${data.face}`,
    };
    if (data.live_room) {
      result.value = data.live_room.roomid.toString();
      result.live_status = data.live_room.liveStatus;
    }
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
    const [{ face, uname, mid, wbi_img }, { b_3, b_4 }] = await Promise.all([
      Bilibili.get("/x/web-interface/nav", {
        baseURL: "https://api.bilibili.com/",
      }),
      Bilibili.get("/x/frontend/finger/spi", {
        baseURL: "https://api.bilibili.com/",
      }),
    ]);
    return {
      avatar: face,
      name: uname,
      mid,
      wbi: wbi_img,
      cookie: `;buvid3=${b_3};buvid4=${b_4}`,
    };
  } catch (error) {
    const win = BrowserWindow.fromId(AllWindows.get("index"));
    win.webContents.send("CookieOverdue");
    return { mid: null };
  }
};

export const GetWebSocket = async (roomid) => {
  try {
    await LoginFirst;
    const params = { type: 0, id: roomid, web_location: 444.8 };
    const [
      { host_list = [], token },
      { room = [] },
      {
        admin,
        uid,
        danmu: { length = 20 },
      },
      { uid: ruid, live_time },
    ] = await Promise.all([
      Bilibili.get("/xlive/web-room/v1/index/getDanmuInfo", {
        params: GetRID(params, Bilibili.defaults.data.wbi),
      }),
      Bilibili.get("/xlive/web-room/v1/dM/gethistory", {
        params: { roomid, room_type: 0 },
      }),
      GetUserRoomInfo(roomid),
      GetLiveInfo(roomid),
    ]);
    const host = host_list[host_list.length - 1];
    return {
      host: `wss://${host.host}:${host.wss_port}/sub`,
      token,
      comments: room,
      admin: admin || uid == ruid,
      roomid,
      uid,
      ruid,
      length,
      live_time,
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
    const { data } = await axios.get(`https://www.bilibili.com/opus/${id}`, {
      headers: Bilibili.defaults.headers,
    });
    let regex = /['"]?(?:comment_id_str|rid_str)['"]?\s*:\s*['"]?(\d+)['"]?/;
    const oid = data.match(regex)[1];
    regex = /['"]?comment_type['"]?\s*:\s*['"]?(\d+)['"]?/;
    const type = data.match(regex)[1];
    const pagination = { offset: "" };
    let result = [];
    const params = {
      next,
      type,
      plat: 1,
      mode: 3,
      oid,
      web_location: 1315875,
      seek_rpid: "",
    };
    do {
      params.pagination_str = JSON.stringify(pagination);
      const { cursor, replies } = await Bilibili.get("/x/v2/reply/wbi/main", {
        baseURL: "https://api.bilibili.com/",
        params: GetRID(params),
      });
      if (!replies || replies.length <= 0) break;
      result = result.concat(replies);
      pagination.offset = cursor.pagination_reply.next_offset;
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
    LoginStatistics.resolve(sponsor > 0);
    return sponsor > 0;
  } catch (error) {
    LoginStatistics.reject(error);
    return false;
  }
};

const LoginFirst = new Promise((resolve, reject) => {
  LoginStatistics.resolve = resolve;
  LoginStatistics.reject = reject;
});

export const PubShield = async (event, shield, handle, operation = true) => {
  try {
    await LoginFirst;
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
    await LoginFirst;
    const result = await API.post("/app/get-words", { use });
    return result || [];
  } catch (error) {
    return [];
  }
};

export const AddRoomTrace = async (rooms = []) => {
  try {
    await LoginFirst;
    const result = await API.post("/app/add-room", { rooms });
    return result;
  } catch (error) {
    return false;
  }
};
