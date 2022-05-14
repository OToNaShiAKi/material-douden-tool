import { Certification, HandleMessage } from "./utils";
import { ipcRenderer } from "electron";

export default class Socket {
  static Command = {
    DANMU_MSG: async ({ info }) => {
      const text = await ipcRenderer.invoke("CutWord", info[1]);
      return {
        info: info[1],
        uid: info[2][0],
        nickname: info[2][1],
        text,
      };
    },
    SUPER_CHAT_MESSAGE: async ({ data }) => {
      if (Socket.AutoClickRedPocket) {
        const text = await ipcRenderer.invoke("CutWord", data.message);
        return {
          info: data.message,
          uid: data.uid,
          nickname: data.user_info.uname,
          style: { color: data.background_bottom_color },
          text,
        };
      }
    },
    POPULARITY_RED_POCKET_START: async ({ data }, socket) => {
      const result = ipcRenderer.invoke(
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
      };
    },
  };
  static AutoClickRedPocket = true;

  constructor({ host_list, uid, ruid, roomid, token, admin }, receive) {
    const host = host_list.pop();
    const socket = new WebSocket(`wss://${host.host}:${host.wss_port}/sub`);
    this.socket = socket;
    this.roomid = roomid;
    this.token = token;
    this.timer = null;
    this.admin = admin;
    this.uid = uid;
    this.receive = receive;
    this.ruid = ruid;

    socket.addEventListener("open", this.Open);
    socket.addEventListener("message", this.Message);
    socket.addEventListener("close", () => clearInterval(this.timer));
  }
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
    const [result] = await new Promise((resolve) =>
      HandleMessage(event.data, resolve)
    );
    const body = JSON.parse(result.body);
    const comment =
      Socket.Command[body.cmd] && (await Socket.Command[body.cmd](body, this));
    comment && this.receive(this.roomid, comment);
  };
}

Socket.Command.SUPER_CHAT_MESSAGE_JPN = Socket.Command.SUPER_CHAT_MESSAGE;
