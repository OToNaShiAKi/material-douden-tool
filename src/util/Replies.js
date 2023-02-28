import { GetVideoInfo } from "@/plugins/axios";
import { FormatDuration } from "./Format";

export const Replies = async (replies = []) => {
  let result = [];
  for (const item of replies) {
    const {
      member: { uname },
      reply_control: { time_desc },
      content: { jump_url },
      ctime,
      mid,
    } = item;
    for (const key in jump_url) {
      const { duration, avatar } = await GetVideoInfo(key);
      result.push({
        id: `${key}-${mid}-${ctime}`,
        title: jump_url[key].title,
        bvid: /^http/i.test(key) ? key : "https://b23.tv/" + key,
        uname,
        time_desc,
        duration,
        avatar,
        duration_desc: FormatDuration(duration),
      });
    }
    result = result.concat(await Replies(item.replies || []));
  }
  return result;
};
