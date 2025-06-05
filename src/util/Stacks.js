import { SendComment } from "../plugins/axios";
import { writeFile, stat, mkdir } from "fs/promises";
import { join } from "path";
import { BrowserWindow, app } from "electron";
import { AllWindows } from "../background";

export const folder = join(app.getPath("exe"), "../logs");
const file = join(folder, "./forbidden-words.txt");
stat(folder).catch(() => mkdir(folder));

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
        const data = `Room: ${send.id} Word: ${send.message} \n`;
        const win = BrowserWindow.fromId(AllWindows.get("index"));
        win.webContents.send("Forbidden", send.id, send.message);
        await writeFile(file, data, { flag: "a+" });
      }
    } else {
      clearInterval(Stacks.timer);
      Stacks.timer = null;
    }
  },
};
