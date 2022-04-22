import BrotliDecode from "brotli/decompress";
import { GetVideoDurantion } from "./axios";
import { ipcRenderer } from "electron";
import { writeFile, utils } from "xlsx";

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
    FormatComment(
      content.slice(20, content.length - suffix.length),
      select,
      fix
    );
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

const i = "320305.131321201";

const n = (r, o) => {
  for (let t = 0; t < o.length - 2; t += 3) {
    let a = o.charAt(t + 2);
    (a = a >= "a" ? a.charCodeAt(0) - 87 : Number(a)),
      (a = "+" === o.charAt(t + 1) ? r >>> a : r << a),
      (r = "+" === o.charAt(t) ? (r + a) & 4294967295 : r ^ a);
  }
  return r;
};

export const e = (r) => {
  let o = r.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g);
  if (null === o) {
    let t = r.length;
    t > 30 &&
      (r =
        "" +
        r.substr(0, 10) +
        r.substr(Math.floor(t / 2) - 5, 10) +
        r.substr(-10, 10));
  } else {
    let e = r.split(/[\uD800-\uDBFF][\uDC00-\uDFFF]/),
      h = e.length,
      f = [];
    for (let C = 0; h > C; C++) "" !== e[C], C !== h - 1 && f.push(o[C]);
    let g = f.length;
    g > 30 &&
      (r =
        f.slice(0, 10).join("") +
        f.slice(Math.floor(g / 2) - 5, Math.floor(g / 2) + 5).join("") +
        f.slice(-10).join(""));
  }
  let u = void 0;
  u = null !== i ? i : "";
  let d = u.split("."),
    m = Number(d[0]) || 0,
    s = Number(d[1]) || 0,
    S = [],
    c = 0;
  for (let v = 0; v < r.length; v++) {
    let A = r.charCodeAt(v);
    128 > A
      ? (S[c++] = A)
      : (2048 > A
          ? (S[c++] = (A >> 6) | 192)
          : (55296 === (64512 & A) &&
            v + 1 < r.length &&
            56320 === (64512 & r.charCodeAt(v + 1))
              ? ((A = 65536 + ((1023 & A) << 10) + (1023 & r.charCodeAt(++v))),
                (S[c++] = (A >> 18) | 240),
                (S[c++] = ((A >> 12) & 63) | 128))
              : (S[c++] = (A >> 12) | 224),
            (S[c++] = ((A >> 6) & 63) | 128)),
        (S[c++] = (63 & A) | 128));
  }
  let p = m,
    F =
      "" +
      String.fromCharCode(43) +
      String.fromCharCode(45) +
      String.fromCharCode(97) +
      ("" +
        String.fromCharCode(94) +
        String.fromCharCode(43) +
        String.fromCharCode(54)),
    D =
      "" +
      String.fromCharCode(43) +
      String.fromCharCode(45) +
      String.fromCharCode(51) +
      ("" +
        String.fromCharCode(94) +
        String.fromCharCode(43) +
        String.fromCharCode(98)) +
      ("" +
        String.fromCharCode(43) +
        String.fromCharCode(45) +
        String.fromCharCode(102));
  for (let b = 0; b < S.length; b++) (p += S[b]), (p = n(p, F));
  return (
    (p = n(p, D)),
    (p ^= s),
    0 > p && (p = (2147483647 & p) + 2147483648),
    (p %= 1e6),
    p.toString() + "." + (p ^ m)
  );
};

export const ExportExcel = (body, header, name, title, config = {}) => {
  const sheet = utils.json_to_sheet(body, { header });
  const workbook = utils.book_new();
  sheet["!cols"] = config.cols;
  sheet["!rows"] = config.rows || new Array(body.length + 1).fill({ hpt: 20 });
  utils.book_append_sheet(workbook, sheet, title || name);
  name += ".xlsx";
  writeFile(workbook, name);
};

export const FormatDuration = (value, hour = false) => {
  if (!value) return "";
  let m = Math.floor(value / 60);
  let s = value - m * 60;
  let time = ":" + s.toString().padStart(2, "0");
  if (hour) {
    let h = Math.floor(m / 60);
    m -= h * 60;
    time = h + ":" + m.toString().padStart(2, "0") + time;
  } else time = m.toString().padStart(2, "0") + time;
  return time;
};

export const Replies = async (replies = []) => {
  let result = [];
  for (const item of replies) {
    const {
      member: { uname },
      ctime,
      reply_control: { time_desc },
      content: { jump_url },
    } = item;
    for (const key in jump_url) {
      const duration = await GetVideoDurantion(key);
      result.push({
        title: jump_url[key].title,
        bvid: /^http/i.test(key) ? key : "https://b23.tv/" + key,
        uname,
        ctime,
        time_desc,
        duration,
        duration_desc: FormatDuration(duration),
      });
    }
    result = result.concat(await Replies(item.replies || []));
  }
  return result;
};
