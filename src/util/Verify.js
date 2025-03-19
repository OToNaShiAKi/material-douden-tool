import BrotliDecode from "brotli/decompress";

export const Certification = (certify) => {
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

export const HeartBeat = () => {
  const buffer = new ArrayBuffer(16);
  const i = new DataView(buffer);
  i.setUint32(0, 0);
  i.setUint16(4, 16);
  i.setUint16(6, 1);
  i.setUint32(8, 2);
  i.setUint32(12, 1);
  return buffer;
};

export const HandleMessage = (blob, resolve) => {
  const Decoder = new TextDecoder();
  const reader = new FileReader();
  reader.addEventListener("load", ({ target }) => {
    const view = new DataView(target.result);
    const result = {
      PacketLength: view.getUint32(0),
      HeadLength: view.getUint16(4),
      PacketVersion: view.getUint16(6),
      Operation: view.getUint32(8),
      Sequence: view.getUint32(12),
      body: [],
    };
    if (result.Operation === 5) {
      const buffer = BrotliDecode(
        new Uint8Array(
          target.result,
          result.HeadLength,
          result.PacketLength - result.HeadLength
        )
      );
      let offset = 0;
      const data = new DataView(buffer.buffer);
      while (offset < buffer.byteLength) {
        const PacketLength = data.getUint32(offset + 0);
        const HeadLength = data.getUint16(offset + 4);
        const text = JSON.parse(
          Decoder.decode(
            new Uint8Array(
              buffer.buffer,
              offset + HeadLength,
              PacketLength - HeadLength
            )
          )
        );
        text.cmd = /DANMU_MSG/.test(text.cmd) ? "DANMU_MSG" : text.cmd;
        result.body.push(text);
        offset += PacketLength;
      }
    }
    resolve(result.body);
  });
  reader.readAsArrayBuffer(blob);
};

export const Colors = Object.freeze({
  UP: "#FF9800",
  Gift: "#4CAF50",
  Ships: {
    1: { message: "#B72E2E", background: "#FEBBAD" },
    2: { message: "#6F3EC0", background: "#D2BCFB" },
    3: { message: "#4153AD", background: "#A9CFFD" },
  },
});

export const Ships = Object.freeze({
  1: "https://s1.hdslb.com/bfs/static/blive/blfe-live-room/static/img/icon-l-1.fde1190..png",
  2: "https://s1.hdslb.com/bfs/static/blive/blfe-live-room/static/img/icon-l-2.6f68d77..png",
  3: "https://s1.hdslb.com/bfs/static/blive/blfe-live-room/static/img/icon-l-3.402ac8f..png",
});
