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
