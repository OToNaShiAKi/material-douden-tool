import { ipcRenderer } from "electron";
// import { writeFileXLSX, utils } from "xlsx";
import BrotliDecode from "brotli/decompress";
import mpegts from "mpegts.js";

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

export const CreatePlayer = (result, video) => {
  const player = mpegts.createPlayer(
    {
      type: result.format_name,
      isLive: true,
      url: result.url_info[0].host + result.base_url + result.url_info[0].extra,
    },
    {
      enableWorker: true,
      enableStashBuffer: false,
      autoCleanupSourceBuffer: true,
    }
  );
  player.attachMediaElement(video);
  player.load();
  player.play();
  player.on(mpegts.Events.ERROR, () => {
    player.unload();
    player.detachMediaElement();
    player.destroy();
    CreatePlayer.player = CreatePlayer(result, video);
  });
  player.on(mpegts.Events.STATISTICS_INFO, () => {
    const end = player.buffered.end(0);
    const current = player.currentTime;
    video.playbackRate = end - current > 1.5 ? 1.5 : 1;
  });
  player.roomid = result.room_id;
  return player;
};

export const FormatTime = (date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const h = date.getHours().toString().padStart(2, "0");
  const t = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${t}:${s}`;
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