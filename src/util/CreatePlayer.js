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
      liveBufferLatencyChasing: true,
      liveBufferLatencyChasingOnPaused: true,
      liveSync: false,
      liveSyncPlaybackRate: 1.4,
      autoCleanupSourceBuffer: true,
    }
  );
  player.attachMediaElement(video);
  player.load();
  player.on(mpegts.Events.ERROR, () => {
    player.unload();
    player.detachMediaElement();
    player.destroy();
    CreatePlayer.player = CreatePlayer(result, video);
  });
  player.roomid = result.room_id;
  player.play();
  return player;
};
