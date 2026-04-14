import { GetVideoInfo } from "@/plugins/axios";
import { FormatDuration } from "./Format";

export const Replies = async (replies = []) => {
  let result = [];
  for (const item of replies) {
    let {
      member: { uname },
      content: { jump_url, message, emote },
      ctime,
      mid,
      rpid,
    } = item;
    if (emote) {
      for (const key in emote) {
        const image = `<img width="20" height="20" src="${emote[key].url}" alt="${emote[key].text}" loading="lazy" />`;
        message = message.replace(emote[key].text, image);
      }
    }
    for (const key in jump_url) {
      const { duration, avatar } = await GetVideoInfo(key);
      result.push({
        id: `${rpid}-${key}-${mid}-${ctime}`,
        title: jump_url[key].title,
        bvid: /^http/i.test(key) ? key : "https://b23.tv/" + key,
        uname,
        duration,
        avatar,
        message,
        duration_desc: FormatDuration(duration),
      });
    }
    if (Object.keys(jump_url).length <= 0) {
      result.push({ id: `${rpid}-${mid}-${ctime}`, uname, message });
    }
    result = result.concat(await Replies(item.replies || []));
  }
  return result;
};
