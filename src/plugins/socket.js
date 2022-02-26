import { Certification, HandleMessage } from "./utils";

export default class Socket {
  constructor(host, port, roomid, token) {
    const socket = new WebSocket(`wss://${host}:${port}/sub`);
    this.socket = socket;
    this.roomid = roomid;
    this.token = token;
    this.timer = null;
    this.comments = [];

    socket.addEventListener("open", this.Open);
    socket.addEventListener("message", this.Message);
    socket.addEventListener("close", (e) => {
      console.log("close", e);
    });
    socket.addEventListener("error", (e) => {
      console.log("error", e);
    });
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
      i.setUint32(0, 0); //整个封包
      i.setUint16(4, 16); //头部
      i.setUint16(6, 1); //协议版本
      i.setUint32(8, 2); //操作码,2为心跳包
      i.setUint32(12, 1); //填1
      this.socket.send(buffer);
    }, 30000);
  };
  Message = async (event) => {
    const result = await new Promise((resolve) =>
      HandleMessage(event.data, resolve)
    );
    for (const item of result) {
      const body = JSON.parse(item.body);
      console.log(body);
      // if (item.Type === 5 && body.cmd === "DANMU_MSG") {
      //   console.log(body);
      // }
    }
  };
}
