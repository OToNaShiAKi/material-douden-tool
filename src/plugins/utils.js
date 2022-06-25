import { ipcRenderer } from "electron";
import { writeFileXLSX, utils } from "xlsx";
import BrotliDecode from "brotli/decompress";

export const FormatComment = (content, select = [], fix = {}, shield = []) => {
  if (content.length <= 0 || select.length <= 0)
    return "内容及所选房间不可为空";
  const { prefix = "", suffix = "" } = fix;
  content = prefix + content + suffix;
  for (const item of shield) {
    content = content.replace(new RegExp(item.shield, "gi"), item.handle);
  }
  ipcRenderer.send("SendComment", content.slice(0, 20), select);
  if (content.length > 20) {
    content = content.slice(20, content.length - suffix.length);
    FormatComment(content, select, fix);
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
        const text = Decoder.decode(
          new Uint8Array(
            buffer.buffer,
            offset + HeadLength,
            PacketLength - HeadLength
          )
        );
        result.body.push(JSON.parse(text));
        offset += PacketLength;
      }
    }
    resolve(result);
  });
  reader.readAsArrayBuffer(blob);
};

export const ExportExcel = (body, header, name, title, config = {}) => {
  const sheet = utils.json_to_sheet(body, { header });
  const workbook = utils.book_new();
  sheet["!cols"] = config.cols;
  sheet["!rows"] = config.rows || new Array(body.length + 1).fill({ hpt: 20 });
  utils.book_append_sheet(workbook, sheet, title || name);
  name += ".xlsx";
  writeFileXLSX(workbook, name);
};

export const FormatDuration = (value, hour = false) => {
  if (!value) return "";
  let m = Math.floor(value / 60);
  let s = value - m * 60;
  let time = ":" + s.toString().padStart(2, "0");
  if (hour) {
    let h = Math.floor(m / 60);
    m -= h * 60;
    time =
      h.toString().padStart(2, "0") +
      ":" +
      m.toString().padStart(2, "0") +
      time;
  } else time = m.toString().padStart(2, "0") + time;
  return time;
};

export const Colors = {
  container: "#f3969a",
  background: "#ffffff",
  text: "#333333",
  tip: "#aaaaaa",
};
