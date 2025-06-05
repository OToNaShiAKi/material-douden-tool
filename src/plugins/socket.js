import { ipcRenderer } from "electron";
import {
  Certification,
  HandleMessage,
  HeartBeat,
  Colors,
  Ships,
} from "../util/Verify";

export default class Socket {
  static Command = {
    DANMU_MSG: async ({ info, cmd }, { ruid }) => {
      if (info[0][9]) return;
      const { emots } = JSON.parse(info[0][15].extra);
      let message = info[1];
      let name = info[2][1];
      let config = "Comment";
      if (emots) {
        const regexp = Object.keys(emots)
          .join("|")
          .replace(/\[|\]/g, (s) => "\\" + s);
        message = info[1].replace(new RegExp(regexp, "ig"), (s) => {
          const { url } = emots[s];
          return `<img src="${url}" width="20" height="20" />`;
        });
      } else if (info[0][12] === 1) {
        const { url } = info[0][13];
        message = `<img src="${url}" height="20" />`;
        config = "Stamp";
      }
      const url = Ships[info[7]];
      if (url) {
        name = `<img src="${url}" width="20" height="20" />` + name;
      }
      return {
        id: `${cmd}-${info[2][0]}-${info[0][4]}`,
        time: info[0][4],
        uid: info[2][0],
        name,
        message,
        admin: info[2][2] || ruid == info[2][0],
        config,
        loginfo: `${info[2][1]}: ${info[1]}`,
      };
    },
    SUPER_CHAT_MESSAGE: async ({ data, cmd, send_time }) => {
      let name = data.user_info.uname;
      const url = Ships[data.user_info.guard_level];
      if (url) {
        name =
          `<img src="${url}" class="ml-2" width="20" height="20" />` + name;
      }
      return {
        id: cmd + "-" + data.id,
        time: send_time ?? data.ts * 1000,
        uid: data.uid,
        name,
        message: `[￥${data.price}]<span class="ml-2">${data.message}</span>`,
        admin: true,
        config: "Superchat",
        loginfo: `${data.user_info.uname}: ￥${data.price} ${data.message}`,
        style: { color: data.background_price_color },
      };
    },
    GUARD_BUY: async ({ data, cmd }) => {
      const colors = Colors.Ships[data.guard_level];
      const url = Ships[data.guard_level];
      const price = (data.price / 1000).toFixed(0);
      let time = Date.now();
      return {
        id: cmd + "-" + time,
        time: time,
        uid: data.uid,
        name: data.username,
        message: `${data.gift_name} - <img src="${url}" class="ml-2" width="20" height="20" /><span>×${data.num}</span><span class="ml-6">￥${price}</span>`,
        admin: true,
        config: "Member",
        loginfo: `${data.username}: ${data.gift_name}×${data.num} ￥${price}`,
        style: {
          backgroundColor: colors.background,
          color: colors.message,
          padding: "0px 8px",
          "border-radius": "4px",
        },
      };
    },
    SEND_GIFT: async ({ data, cmd, send_time }, socket) => {
      if (data.coin_type !== "gold") return;
      const number =
        data.super_batch_gift_num || data.super_gift_num || data.num;
      const price = (data.price * number) / 1000;
      const { gif = img_basic, img_basic } = data.gift_info;
      const message = `${data.giftName} - <img src="${gif}" width="20" height="20" /><span>×${number}</span><span class="ml-2">￥${price}</span>`;
      send_time = send_time ?? data.timestamp * 1000;
      const result = {
        id: cmd + "-" + data.tid,
        time: send_time,
        uid: data.sender_uinfo.uid,
        name: data.uname,
        message,
        admin: true,
        config: "Gift",
        loginfo: `${data.uname}: ${data.giftName}×${number} ￥${price}`,
        style: { color: Colors.Gift },
      };
      if (socket.combos.has(data.batch_combo_id)) {
        socket.combos.get(data.batch_combo_id).message = message;
        Socket.Write(socket.roomid, socket.live_time, result);
        return;
      }
      socket.combos.set(data.batch_combo_id, result);
      return result;
    },
    LIVE: ({ roomid, live_time, cmd }, socket) => {
      live_time = live_time * 1000;
      socket.live_time = live_time;
      ipcRenderer.send("Channel", "Live", roomid);
      const message = new Date(live_time).toLocaleTimeString() + " Start Live";
      return {
        id: cmd + "-" + roomid,
        time: live_time,
        uid: socket.ruid,
        name: socket.name,
        message,
        admin: true,
        config: "Live",
        loginfo: `${socket.name}: ${message}`,
        style: { color: Colors.UP },
      };
    },
  };
  static AutoWriteComment =
    localStorage.getItem("AutoWriteComment") !== "false";
  static AutoChangeMedal = localStorage.getItem("AutoChangeMedal") !== "false";
  static AutoCopyForbidWord =
    localStorage.getItem("AutoCopyForbidWord") !== "false";
  static UseShareShields = localStorage.getItem("UseShareShields") !== "false";
  constructor(host) {
    this.roomid = host.roomid;
    this.token = host.token;
    this.timer = null;
    this.admin = host.admin;
    this.uid = host.uid;
    this.ruid = host.ruid;
    this.name = host.name;
    this.comments = host.comments.reverse();
    this.reconnect = true;
    this.combos = new Map();
    this.live_time = host.live_time * 1000;

    this.socket = this.Connect(host.host);
  }
  static Write = (roomid, live_time, comment) => {
    Socket.AutoWriteComment &&
      ipcRenderer.send("WriteComment", roomid, live_time, comment);
  };

  Connect = (host) => {
    const socket = new WebSocket(host);
    socket.addEventListener("open", this.Open);
    socket.addEventListener("message", this.Message);
    socket.addEventListener("close", () => {
      clearInterval(this.timer);
      if (this.reconnect) {
        this.socket = this.Connect(host);
      }
    });
    return socket;
  };
  Open = () => {
    this.socket.send(
      Certification(
        JSON.stringify({
          uid: this.uid,
          roomid: +this.roomid,
          protover: 3,
          platform: "web",
          type: 2,
          key: this.token,
        })
      )
    );
    ipcRenderer.send("Channel", "Live", this.roomid);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const buffer = HeartBeat();
      this.socket.send(buffer);
    }, 30000);
  };
  Message = async ({ data }) => {
    const messages = await new Promise((resolve) =>
      HandleMessage(data, resolve)
    );
    for (const item of messages) {
      const comment =
        Socket.Command[item.cmd] &&
        (await Socket.Command[item.cmd](item, this));
      if (comment) {
        Socket.Write(this.roomid, this.live_time, comment);
        this.comments.unshift(comment);
      }
    }
  };
}
