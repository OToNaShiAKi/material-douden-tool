import { BrowserWindow } from "electron";
import { Server } from "socket.io";
import { AllWindows } from "../background";
import { createServer } from "http";
import speech from "../assets/speech.json";

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: ["https://localhost"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const win = BrowserWindow.fromId(AllWindows.index);
  !win.isDestroyed() && win.webContents.send("SpeechConnect", true);
  socket.on("SpeechRecognition", (messgae) => {
    !win.isDestroyed() && win.webContents.send("SpeechRecognition", messgae);
  });
  socket.on("disconnect", () => {
    !win.isDestroyed() && win.webContents.send("SpeechConnect", false);
  });
});

server.listen(9669);

server.on("request", async (request, response) => {
  response.writeHead(200, {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "http://localhost:9669/",
  });
  response.end(Buffer.from(speech.data));
});
