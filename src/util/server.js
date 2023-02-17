import { SendComment } from "../plugins/axios";
import { writeFile } from "fs/promises";
import { join } from "path";
import { BrowserWindow, app } from "electron";
import { AllWindows } from "../background";

export const Stacks = {
  Messages: [],
  timer: null,
  interval: async () => {
    const send = Stacks.Messages.shift();
    if (send) {
      const { code, message } = await SendComment(send.id, send.message);
      if (code === 10030) {
        clearInterval(Stacks.timer);
        Stacks.Messages.unshift(send);
        Stacks.timer = setInterval(Stacks.interval, 1750);
      } else if (message === "f") {
        const data = `屏蔽词：${send.message} 房间：${send.id}\n`;
        const file = join(app.getPath("exe"), "../forbidden-words.txt");
        const win = BrowserWindow.fromId(AllWindows.index);
        win.webContents.send("Forbidden", send.id, send.message);
        await writeFile(file, data, { flag: "a+" });
      }
    } else {
      clearInterval(Stacks.timer);
      Stacks.timer = null;
    }
  },
};
