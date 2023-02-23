import { Bilibili, Login, Music163 } from "./headers.js";
import QS from "qs";
import axios from "axios";

const GetFollow = async (vmid) => {
  try {
    const {
      data: { follower },
    } = await Login.get("/x/relation/stat", { params: { vmid } });
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
    return await Login.get("/qrcode/getLoginUrl", {
      baseURL: "https://passport.bilibili.com/",
    });
  } catch (error) {
    return { url: "", oauthKey: "" };
  }
};

export const GetLoginInfo = async (oauthKey) => {
  try {
    return await Login.post(
      "/qrcode/getLoginInfo",
      QS.stringify({ oauthKey }),
      { baseURL: "https://passport.bilibili.com/" }
    );
  } catch (error) {
    return { status: false, data: null };
  }
};

export const GetLiveInfo = async (roomid) => {
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
        room_id: roomid,
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
      roomid,
      g_qn_desc,
      base_url,
      accept_qn,
      current_qn,
      url_info,
      format_name,
    };
  } catch (error) {
    return { roomid, live_status: 0, code: error.code };
  }
};

export const SearchLive = async (keyword) => {
  try {
    const {
      data: {
        result: { live_user = [] },
      },
    } = await Login.get("/x/web-interface/wbi/search/type", {
      params: {
        order: "online",
        platform: "pc",
        keyword,
        search_type: "live",
      },
    });
    return live_user.map((item) => ({
      uid: item.uid.toString(),
      value: item.roomid.toString(),
      name: item.uname,
      text: item.uname.replace(/<em class="keyword">|<\/em>/g, ""),
      avatar: item.uface,
      live_status: item.live_status,
      follower: item.attentions,
    }));
  } catch (error) {
    return [];
  }
};

export const SearchUser = async (mid) => {
  try {
    const { data } = await Login.get("/x/space/wbi/acc/info", {
      params: { mid, platform: "web" },
    });
    const result = {
      uid: data.mid.toString(),
      value: data.live_room.roomid.toString(),
      text: data.name,
      avatar: data.face,
      live_status: data.live_room.liveStatus,
    };
    result.follower = await GetFollow(item.mid);
    return result;
  } catch (error) {
    return null;
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
      data: {
        live_users: { items = [] },
      },
    } = await Login.get("/x/polymer/web-dynamic/v1/portal");
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

export const GetMusic = async (keyword) => {
  try {
    const {
      result: { songs },
    } = await Music163.get("/cloudsearch/pc", {
      params: { s: keyword, type: 1, limit: 10 },
    });
    return await Promise.all(
      songs.map(async ({ name, ar, id, dt, al }) => {
        try {
          const { lrc, tlyric, yrc, ytlrc } = await Music163.get(
            "/song/lyric",
            { params: { id, lv: 1, tv: 1, yv: 1, ytv: 1 } }
          );
          return {
            id: `${al.id}-${id}`,
            name,
            lyric: lrc ? lrc.lyric : "",
            tlyric: tlyric ? tlyric.lyric : "",
            ylyric: yrc ? yrc.lyric : "",
            ytlyric: ytlrc ? ytlrc.lyric : "",
            singer: ar.map(({ name }) => name).join("/"),
            origin: "网易云",
            duration: dt,
            avatar: al.picUrl,
          };
        } catch (error) {
          return { lyric: "", tlyric: "" };
        }
      })
    );
  } catch (error) {
    return [];
  }
};
