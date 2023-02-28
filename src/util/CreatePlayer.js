// import { writeFileXLSX, utils } from "xlsx";
import mpegts from "mpegts.js";

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