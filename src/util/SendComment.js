import { ipcRenderer } from "electron";

export const CommentLength = { default: 20 };

export const SendComment = (content, select = [], fix = {}, shield = []) => {
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
      SendComment(content, [item], fix);
    }
  }
};