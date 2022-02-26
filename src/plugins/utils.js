import { SendComment } from "./axios";
import { ipcRenderer } from "electron";
import BrotliDecode from "brotli/decompress";

export const FormatComment = (
  content,
  select = [],
  { prefix = "", suffix = "" } = {},
  shield = {}
) => {
  content = prefix + content + suffix;
  for (let key in shield) {
    content = content.replace(new RegExp(key, "gi"), shield[key]);
  }
  if (content.length > 20) {
    FormatComment(content.slice(20), select);
    content = content.slice(0, 20);
  }
  ipcRenderer.send(SendComment.name, content, select);
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
  const reader = new FileReader();
  reader.addEventListener("load", ({ target: { result: buffer } }) => {
    const decoder = new TextDecoder();
    const view = new DataView(buffer);
    let offset = 0;
    const packet = {};
    const result = [];
    while (offset < buffer.byteLength) {
      const PacketLength = view.getUint32(offset + 0);
      const HeadLength = view.getUint16(offset + 4);
      const PacketVersion = view.getUint16(offset + 6);
      const PacketType = view.getUint32(offset + 8);
      const number = view.getUint32(12);
      if (PacketVersion == 3) {
        const BufferFrom = BrotliDecode(
          new Uint8Array(buffer, offset + HeadLength, PacketLength - HeadLength)
        );
        const view = new DataView(BufferFrom.buffer);
        let OffsetVersion3 = 0;
        while (OffsetVersion3 < BufferFrom.byteLength) {
          const PacketLength = view.getUint32(OffsetVersion3 + 0);
          const HeadLength = view.getUint16(OffsetVersion3 + 4);
          const PacketVersion = view.getUint16(OffsetVersion3 + 6);
          const PacketType = view.getUint32(OffsetVersion3 + 8);
          const number = view.getUint32(12);
          packet.Length = PacketLength;
          packet.HeadLength = HeadLength;
          packet.Version = PacketVersion;
          packet.Type = PacketType;
          packet.Number = number;
          const dataArray = new Uint8Array(
            BufferFrom.buffer,
            OffsetVersion3 + HeadLength,
            PacketLength - HeadLength
          );
          packet.body = decoder.decode(dataArray);
          result.push(packet);
          OffsetVersion3 += PacketLength;
        }
      } else {
        packet.Length = PacketLength;
        packet.HeadLength = HeadLength;
        packet.Version = PacketVersion;
        packet.Type = PacketType;
        packet.Number = number;
        if (PacketType == 3) {
          packet.body = new DataView(
            buffer,
            offset + HeadLength,
            PacketLength - HeadLength
          ).getUint32(0);
        } else {
          packet.body = decoder.decode(
            new Uint8Array(
              buffer,
              offset + HeadLength,
              PacketLength - HeadLength
            )
          );
        }
        result.push(packet);
      }
      offset += PacketLength;
    }
    resolve(result);
  });
  reader.readAsArrayBuffer(blob);
};
