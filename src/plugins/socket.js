import { ipcRenderer } from "electron";
import { Certification,  HandleMessage } from "../util/client";
import GoTo from "vuetify/lib/services/goto";

export default class Socket {
  static Command = {
    DANMU_MSG: async ({ info, cmd }, uid) => {
      if (info[0][9] || info[0][12] === 1) return;
      const translate = await Socket.Translate(info[1].trim());
      return {
        id: cmd + "-" + info[0][4],
        message: info[1],
        title: info[2][1],
        translate,
        admin: info[2][2] || uid == info[2][0],
      };
    },
    SUPER_CHAT_MESSAGE_JPN: async ({ data, cmd }) => {
      const translate =
        data.message_jpn || (await Socket.Translate(data.message));
      return {
        id: cmd + "-" + data.id,
        message: data.message,
        title: data.user_info.uname,
        translate,
        style: { color: data.background_bottom_color },
      };
    },
  };
  static AutoUp = true;
  static AutoTranslate = localStorage.getItem("AutoTranslate") === "true";
  static AutoClickRedPocket = localStorage.getItem("AutoClickRedPocket") !== "false";
  static AutoChangeMedal = localStorage.getItem("AutoChangeMedal") !== "false";
  static AutoCopyForbidWord = localStorage.getItem("AutoCopyForbidWord") !== "false";
  static target = document.getElementById("comment");
  constructor(host) {
    this.timer = null;
    this.comments = [];
    this.uid = host.uid;
    this.admin = host.admin;
    this.ruid = host.ruid;
    this.reconnect = true;
  }
  static GoToBottom = () =>
    GoTo(Socket.target.scrollHeight, { easing: "easeInOutCubic" });
  static Translate = (text) =>
    Socket.AutoTranslate
      ? ipcRenderer.invoke("Translate", text, Socket.language)
      : "";
  Connect = (host) => {
    const socket = new WebSocket(host.host);
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
  Message = async ({ data }) => {
    const messages = await new Promise((resolve) =>
      HandleMessage(data, resolve)
    )(data);
    for (const item of messages) {
      const comment =
        Socket.Command[item.cmd] &&
        (await Socket.Command[item.cmd](item, this.ruid));
      if (comment) {
        this.comments.push(comment);
        Socket.AutoUp && Socket.GoToBottom();
      }
    }
  };
}
