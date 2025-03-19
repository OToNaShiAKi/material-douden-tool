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
  if (value < 0) return "";
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
  } else {
    time = m.toString().padStart(2, "0") + time;
  }
  return time;
};

export const Colors = Object.freeze({
  container: "#f3969a",
  background: "#ffffff",
  text: "#333333",
  tip: "#aaaaaa",
});

export const Keys = [
  { key: "AutoCopyForbidWord", text: "自动复制屏蔽弹幕" },
  {
    key: "AutoChangeMedal",
    text: "自动换牌子",
    hint: "如果未拥有则不佩戴",
  },
  {
    key: "AutoWriteComment",
    text: "自动写入弹幕到本地",
    hint: "弹幕在安装目录下logs文件夹中",
  },
  {
    key: "UseShareShields",
    text: "使用共享屏蔽词库",
    hint: "他人创建词条无法删除只可覆盖",
  },
];
