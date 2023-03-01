import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
} from "docx";
import { FormatDuration } from "./Format";
import { writeFileXLSX, utils, read } from "xlsx";
import MD5 from "blueimp-md5";
import HtmlToCanvas from "html2canvas";

const Mapping = Object.freeze({
  title: "标题",
  bvid: "链接",
  duration_desc: "时长",
  time_desc: "发布",
  uname: "推荐人",
});

export const ExportWord = async (comments, config, need) => {
  let total = 0;
  const sections = comments.map((v) => {
    const children = config.map((key) => {
      let child = new TextRun({
        text: v[key],
        size: 24,
        bold: key === "title",
      });
      if (key === "bvid")
        child = new ExternalHyperlink({ children: [child], link: v[key] });
      return new Paragraph({
        children: [
          new TextRun({
            text: `【${Mapping[key]}】`,
            bold: true,
            size: 24,
          }),
          child,
        ],
        heading: key === "title" ? HeadingLevel.HEADING_3 : undefined,
      });
    });
    children.push(new Paragraph("\n"));
    total += v.duration || 0;
    return {
      properties: { type: SectionType.CONTINUOUS },
      children,
    };
  });
  if (need) {
    sections.unshift({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `【总时长】`,
              bold: true,
              italics: false,
            }),
            new TextRun({
              text: FormatDuration(total, true),
              italics: false,
            }),
          ],
          heading: HeadingLevel.HEADING_4,
        }),
        new Paragraph("\n"),
      ],
    });
  }
  const buffer = await Packer.toBuffer(
    new Document({ title: "动画鉴赏", sections })
  );
  return buffer;
};

export const WriteExcel = (body, header, name, title, config = {}) => {
  const sheet = utils.json_to_sheet(body, { header });
  const workbook = utils.book_new();
  sheet["!cols"] = config.cols;
  sheet["!rows"] = config.rows || new Array(body.length + 1).fill({ hpt: 20 });
  utils.book_append_sheet(workbook, sheet, title || name);
  name += ".xlsx";
  writeFileXLSX(workbook, name);
};

export const ExportExcel = (comments, config, need) => {
  let total = 0;
  const header = config.map((v) => Mapping[v]);
  const cols = config.map(() => ({ wch: 0 }));
  const body = comments.map((v) => {
    const row = {};
    for (let i = 0; i < config.length; i++) {
      const key = config[i];
      row[Mapping[key]] = v[key];
      const width = /[\u4e00-\u9fa5]/.test(row[Mapping[key]])
        ? row[Mapping[key]].length * 2
        : row[Mapping[key]].length + 10;
      cols[i].wch = cols[i].wch > width ? cols[i].wch : width;
    }
    total += v.duration || 0;
    return row;
  });
  if (need) body.push({ 时长: FormatDuration(total, true) });
  return { body, header, cols };
};

const AssHeader = `[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1
Style: Default - Translate,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

const LineRegex =
  /Dialogue: \d+,(\d{1}:\d{2}:\d{2}.\d{2}),(\d{1}:\d{2}:\d{2}.\d{2}),(.*),.*,\d+,\d+,\d+,.*,(.*)/g;

export const LineStart = {
  start: "00:00:00.000",
  end: "00:00:00.000",
  lyric: "",
  tlyric: "",
  id: "00:00:00.000",
};

export const ReadLyric = (file) => {
  const reader = new FileReader();
  const promise = new Promise((resolve) => {
    reader.addEventListener("load", ({ target: { result } }) => {
      const music = [];
      result.replace(LineRegex, (string, start, end, style, lyric) => {
        start = "0" + start + "0";
        end = "0" + end + "0";
        const match = /\{\\k\d+\}/g;
        let ylyric = "";
        if (match.test(lyric)) {
          ylyric = lyric;
          lyric = lyric.replace(match, "");
        }
        for (
          let i = 0;
          i < music.length && /Default( - Translate)?/.test(style);
          i++
        ) {
          const item = music[i];
          if (item.start === start && item.end === end) {
            if (/Default - Translate/.test(style)) {
              item.tlyric = lyric;
              item.tylyric = ylyric;
            } else if (/Default/.test(style)) {
              item.lyric = lyric;
              item.ylyric = ylyric;
            }
            return;
          }
        }
        music.push({ start, end, lyric, ylyric });
      });
      resolve(music);
    });
  });
  reader.readAsText(file);
  return promise;
};

export const ExportAegisub = (lyric, K = false) => {
  let Lyric = AssHeader;
  let TranslateLyric = "";
  for (const line of lyric) {
    const lyric = K && line.ylyric ? line.ylyric : line.lyric;
    const tlyric = K && line.tylyric ? line.tylyric : line.tlyric;
    const start = line.start.slice(1, 11).padEnd(10, "0");
    const end = line.end.slice(1, 11).padEnd(10, "0");
    Lyric += `Dialogue: 0,${start},${end},Default,,0,0,0,,${lyric}\n`;
    if (line.tlyric) {
      TranslateLyric += `Dialogue: 0,${start},${end},Default - Translate,,0,0,0,,${tlyric}\n`;
    }
  }
  Lyric += TranslateLyric;
  return Lyric;
};

const Reduce = (previous, value, index) =>
  previous + +value * 60 ** (2 - index);

export const SaveLyric = (lyric, name, singer, id) => {
  const music = {
    id: id || MD5(`${name}.${singer}}.${Date.now()}`),
    name,
    singer,
    lyric: "",
    tlyric: "",
    stamps: [],
    origin: "local",
    avatar: "/images/favicon.png",
  };
  const start = lyric[0].start.split(":").reduce(Reduce, 0);
  const end = lyric[lyric.length - 1].end.split(":").reduce(Reduce, 0);
  music.duration = (end - start) * 1000;
  for (const item of lyric) {
    music.lyric += `[${item.start}]${item.lyric}\n`;
    music.tlyric += `[${item.start}]${item.tlyric}\n`;
    music.stamps.push({
      ...item,
      stamp: item.start.split(":").reduce(Reduce, 0) * 1000,
    });
  }
  music.language = /\[(\d{1,2}:)*\d{1,2}:[0-9.]{1,8}\](.*)\n?/g.test(
    music.tlyric
  )
    ? "双语"
    : "单语";
  return music;
};

export const ConvertLyric = (next) => {
  let index = 0;
  const lyric = next.stamps.map(
    ({ start, lyric, tlyric, end }, index, array) => {
      if (!end && array[index + 1]) {
        end = array[index + 1].start;
      } else if (!end) {
        const duration = next.duration / 1000;
        end = FormatDuration(Math.floor(duration), true);
        end += ".";
        end += duration.toString().split(".")[1] || "000";
      }
      return { id: start, lyric, tlyric, start, end };
    }
  );
  const Replace = (s, start, end, m) => {
    m = m.replace(
      /\(\d+,(\d+),\d+\)(.)/g,
      (string, k, v) => `{\\k${+k / 10}}${v}`
    );
    end = (+end + +start) / 1000;
    start = +start / 1000;
    lyric[index].start = FormatDuration(Math.floor(start), true);
    lyric[index].start += ".";
    lyric[index].start += start.toString().split(".")[1] || "000";
    lyric[index].end = FormatDuration(Math.floor(end), true);
    lyric[index].end += ".";
    lyric[index].end += end.toString().split(".")[1] || "000";
    lyric[index++].ylyric = m;
    return m + "\n";
  };
  next.ylyric = next.ylyric.replace(/\[(\d+),(\d+)\](.*)\n?/g, Replace);
  index = 0;
  next.tlyric = next.tlyric.replace(/\[(\d+),(\d+)\](.*)\n?/g, Replace);
  index = 0;
  return { name: next.name, singer: next.singer, lyric };
};

export const DomToImage = async (Dom) =>
  (await HtmlToCanvas(Dom))
    .toDataURL()
    .replace(/^data:image\/(png|gif|jpeg);base64,/, "");

export const ExportCandy = (file, Dom) => {
  const result = [];
  const reader = new FileReader();
  const chinese = document.querySelector("#dom-to-image-cn .card-text");
  const japanese = document.querySelector("#dom-to-image-jp .card-text");
  const promise = new Promise((resolve) => {
    reader.addEventListener("load", async ({ target }) => {
      const { Sheets } = read(target.result, { type: "buffer" });
      for (const key in Sheets) {
        const json = utils.sheet_to_json(Sheets[key]);
        for (const item of json) {
          chinese.innerText = item["中文"];
          japanese.innerText = item["日文"];
          result.push(await DomToImage(Dom));
        }
      }
      chinese.innerText = "";
      japanese.innerText = "";
      resolve(result);
    });
  });
  reader.readAsArrayBuffer(file);
  return promise;
};

export const ReadLogo = (file) => {
  const reader = new FileReader();
  const promise = new Promise((resolve) => {
    reader.addEventListener("load", async ({ target }) =>
      resolve(target.result)
    );
  });
  reader.readAsDataURL(file);
  return promise;
};
