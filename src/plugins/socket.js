import { Certification, HandleMessage } from "./utils";
import { ipcRenderer } from "electron";
const AutoClickRedPocket =
  localStorage.getItem("AutoClickRedPocket") === "false";
const filters = JSON.parse(localStorage.getItem("filters")) || [
  "老板大气！点点红包抽礼物！",
];

export default class Socket {
  static Command = {
    DANMU_MSG: async ({ info }) => {
      const text = await ipcRenderer.invoke("CutWord", info[1]);
      return {
        info: info[1],
        uid: info[2][0],
        nickname: info[2][1],
        text,
        id: Date.now(),
      };
    },
    SUPER_CHAT_MESSAGE: async ({ data }) => {
      const text = await ipcRenderer.invoke("CutWord", data.message);
      return {
        info: data.message,
        uid: data.uid,
        nickname: data.user_info.uname,
        style: { color: data.background_bottom_color },
        text,
        id: Date.now(),
      };
    },
    POPULARITY_RED_POCKET_START: async ({ data }, socket) => {
      if (Socket.AutoClickRedPocket) {
        const result = await ipcRenderer.invoke(
          "ClickRedPocket",
          socket.ruid,
          socket.roomid,
          data.lot_id
        );
        return {
          info: "自动点击红包" + (result ? "成功" : "失败"),
          uid: socket.uid,
          nickname: "System",
          class: "primary--text",
          id: Date.now(),
        };
      }
    },
    ROOM_ADMIN_ENTRANCE: ({ uid }, socket) => {
      socket.admin = socket.uid === uid;
    },
    LIVE: ({ roomid }) => ipcRenderer.send("Live", roomid),
  };
  static AutoClickRedPocket = !AutoClickRedPocket;
  static filters = filters;

  constructor({ host_list, uid, ruid, roomid, token, admin, comments }) {
    const host = host_list.pop();
    this.roomid = roomid;
    this.token = token;
    this.timer = null;
    this.admin = admin;
    this.uid = uid;
    this.ruid = ruid;
    this.comments = comments.reverse();
    this.reconnect = true;

    this.socket = this.Connect(host);
  }
  Connect = (host) => {
    const socket = new WebSocket(`wss://${host.host}:${host.wss_port}/sub`);
    socket.addEventListener("open", this.Open);
    socket.addEventListener("message", this.Message);
    socket.addEventListener("close", () =>
      this.reconnect
        ? (this.socket = this.Connect(host))
        : clearInterval(this.timer)
    );
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
    ipcRenderer.send("Live", this.roomid);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const buffer = new ArrayBuffer(16);
      const i = new DataView(buffer);
      i.setUint32(0, 0);
      i.setUint16(4, 16);
      i.setUint16(6, 1);
      i.setUint32(8, 2);
      i.setUint32(12, 1);
      this.socket.send(buffer);
    }, 30000);
  };
  Message = async (event) => {
    const message = await new Promise((resolve) =>
      HandleMessage(event.data, resolve)
    );
    for (const body of message.body) {
      const comment =
        Socket.Command[body.cmd] &&
        (await Socket.Command[body.cmd](body, this));
      if (comment && !Socket.filters.includes(comment.info)) {
        this.comments.unshift(comment);
      }
    }
  };
}
