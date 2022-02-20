import { BrotliDecode } from "./decode";

const Certification = (certify) => {
  const json = new TextEncoder().encode(certify);
  const buffer = new ArrayBuffer(json.byteLength + 16);
  const view = new DataView(buffer);
  view.setUint32(0, json.byteLength + 16);
  view.setUint16(4, 16);
  view.setUint16(6, 1);
  view.setUint32(8, 7);
  view.setUint32(12, 1);
  for (let r = 0; r < json.byteLength; r++) {
    view.setUint8(16 + r, json[r]);
  }
  return buffer;
};

const HandleMessage = (blob, resolve) => {
  const reader = new FileReader();
  reader.addEventListener("load", ({ target: { result: buff } }) => {
    let decoder = new TextDecoder(); //解码器
    let view = new DataView(buff); //视图
    let offset = 0;
    let packet = {};
    let result = [];
    while (offset < buff.byteLength) {
      //数据提取
      let packetLen = view.getUint32(offset + 0);
      let headLen = view.getUint16(offset + 4);
      let packetVer = view.getUint16(offset + 6);
      let packetType = view.getUint32(offset + 8);
      let num = view.getUint32(12);
      if (packetVer == 3) {
        //解压数据
        let brArray = new Uint8Array(
          buff,
          offset + headLen,
          packetLen - headLen
        );
        let buffFromBr = BrotliDecode(brArray); //返回Int8Array视图
        let view = new DataView(buffFromBr.buffer);
        let offset_Ver3 = 0;
        while (offset_Ver3 < buffFromBr.byteLength) {
          //解压后数据提取
          let packetLen = view.getUint32(offset_Ver3 + 0);
          let headLen = view.getUint16(offset_Ver3 + 4);
          let packetVer = view.getUint16(offset_Ver3 + 6);
          let packetType = view.getUint32(offset_Ver3 + 8);
          let num = view.getUint32(12);
          packet.Len = packetLen;
          packet.HeadLen = headLen;
          packet.Ver = packetVer;
          packet.Type = packetType;
          packet.Num = num;
          let dataArray = new Uint8Array(
            buffFromBr.buffer,
            offset_Ver3 + headLen,
            packetLen - headLen
          );
          packet.body = decoder.decode(dataArray); //utf-8格式数据解码，获得字符串
          result.push(JSON.stringify(packet)); //数据打包后传入数组
          offset_Ver3 += packetLen;
        }
      } else {
        packet.Len = packetLen;
        packet.HeadLen = headLen;
        packet.Ver = packetVer;
        packet.Type = packetType;
        packet.Num = num;
        let dataArray = new Uint8Array(
          buff,
          offset + headLen,
          packetLen - headLen
        );
        if (packetType == 3) {
          //获取人气值
          packet.body = new DataView(
            buff,
            offset + headLen,
            packetLen - headLen
          ).getUint32(0); //若入参为dataArray.buffer，会返回整段buff的视图，而不是截取后的视图
        } else {
          packet.body = decoder.decode(dataArray); //utf-8格式数据解码，获得字符串
        }
        result.push(JSON.stringify(packet)); //数据打包后传入数组
      }
      offset += packetLen;
    }
    resolve(result);
  });
  reader.readAsArrayBuffer(blob);
};

export default class Socket {
  constructor(host, port, roomid, token) {
    const socket = new WebSocket(`wss://${host}:${port}/sub`);
    this.socket = socket;
    this.roomid = roomid;
    this.token = token;
    this.timer = null;

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
    console.log(result);
  };
}
