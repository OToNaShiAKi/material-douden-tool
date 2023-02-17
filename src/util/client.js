import { ipcRenderer } from "electron";
// import { writeFileXLSX, utils } from "xlsx";
import BrotliDecode from "brotli/decompress";

export const CommentLength = { default: 20 };

export const FormatComment = (content, select = [], fix = {}, shield = []) => {
  if (content.length <= 0 || select.length <= 0) return;
  const { prefix = "", suffix = "" } = fix;
  content = (prefix + content + suffix).trim();
  for (const item of shield) {
    content = content.replace(new RegExp(item.shield, "gi"), item.handle);
  }
  for (const item of select) {
    const { [item]: length = CommentLength.default } = CommentLength;
    ipcRenderer.send("SendComment", content.slice(0, length), item);
    if (content.length > length) {
      content = content.slice(length, content.length - suffix.length);
      FormatComment(content, [item], fix);
    }
  }
};

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