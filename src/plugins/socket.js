import { Certification, HandleMessage } from "./utils";
import { ipcRenderer } from "electron";

export default class Socket {
  constructor(host, port, roomid, token, admin, comments, receive) {
    const socket = new WebSocket(`wss://${host}:${port}/sub`);
    this.socket = socket;
    this.roomid = roomid;
    this.token = token;
    this.timer = null;
    this.comments = comments;
    this.admin = admin;
    this.receive = receive;

    socket.addEventListener("open", this.Open);
    socket.addEventListener("message", this.Message);
    socket.addEventListener("close", () => clearInterval(this.timer));
  }
  Open = () => {
    this.socket.send(
      Certification(
        JSON.stringify({
          uid: 0,
          roomid: this.roomid,
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
    if (result.Type === 5 && body.cmd === "DANMU_MSG") {
      const text = await ipcRenderer.invoke("CutWord", body.info[1]);
      this.receive(this.roomid, {
        info: body.info[1],
        uid: body.info[2][0],
        nickname: body.info[2][1],
        text,
      });
    }
  };
}
