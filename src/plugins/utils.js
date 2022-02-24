import { SendComment } from "./axios";
import { ipcRenderer } from "electron";

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
