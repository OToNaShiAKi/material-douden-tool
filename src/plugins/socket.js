import { ipcRenderer } from "electron";
import { Certification, HandleMessage, HeartBeat } from "../util/Verify";

export default class Socket {
  static Command = {
    DANMU_MSG: async ({ info, cmd }, uid) => {
      if (info[0][9] || info[0][12] === 1) return;
      const translate = await Socket.Translate(info[1]);
      return {
        id: cmd + "-" + info[0][4],
        message: info[1],
        uid: info[2][0],
        name: info[2][1],
        admin: info[2][2] || uid == info[2][0],
        translate,
      };
    },
    SUPER_CHAT_MESSAGE: async ({ data, cmd }) => {
      const translate = await Socket.Translate(data.message);
      return {
        id: cmd + "-" + data.id,
        message: data.message,
        name: data.user_info.uname,
        uid: data.uid,
        style: { color: data.background_bottom_color },
        admin: 1,
        translate,
      };
    },
    LIVE: ({ roomid }) => ipcRenderer.send("Channel", "Live", roomid),
    ROOM_ADMIN_ENTRANCE: ({ uid }, socket) => {
      socket.admin = socket.uid === uid;
    },
    POPULARITY_RED_POCKET_START: async ({ data, cmd }, socket) => {
      if (Socket.AutoClickRedPocket) {
        const result = await ipcRenderer.invoke(
          "ClickRedPocket",
          socket.ruid,
          socket.roomid,
          data.lot_id
        );
        return {
          message: "自动点击红包" + (result ? "成功" : "失败"),
          uid: socket.uid,
          name: "System",
          class: "primary--text",
          admin: 1,
          id: cmd + "-" + Date.now(),
        };
      }
    },
  };
  static AutoTranslate = localStorage.getItem("AutoTranslate") === "true";
  static AutoClickRedPocket =
    localStorage.getItem("AutoClickRedPocket") !== "false";
  static AutoChangeMedal = localStorage.getItem("AutoChangeMedal") !== "false";
  static AutoCopyForbidWord =
    localStorage.getItem("AutoCopyForbidWord") !== "false";
  constructor(host) {
    this.roomid =host. roomid;
    this.token = host.token;
    this.timer = null;
    this.admin = host.admin;
    this.uid = host.uid;
    this.ruid = host.ruid;
    this.comments = host.comments.reverse();
    this.reconnect = true;

    this.socket = this.Connect(host.host);
  }
  static Translate = (text) =>
    Socket.AutoTranslate
      ? ipcRenderer.invoke("Translate", text, Socket.language)
      : "";
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
        (await Socket.Command[item.cmd](item, this.ruid));
      if (comment) {
        this.comments.unshift(comment);
      }
    }
  };
}
