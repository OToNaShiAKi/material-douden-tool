import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
} from "docx";
import { FormatDuration } from "./Format";
import { Workbook } from "exceljs";
import MD5 from "blueimp-md5";
import HtmlToCanvas from "html2canvas";

export const Mapping = Object.freeze([
  { text: "推荐", value: "uname" },
  { text: "评论", value: "message" },
  { text: "封面", value: "avatar", sortable: false },
  { text: "标题", value: "title" },
  { text: "链接", value: "bvid", sortable: false },
  { text: "时长", value: "duration_desc" },
  { text: "操作", value: "actions", sortable: false },
]);

const findMapping = (value) => Mapping.find((m) => m.value === value);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 240;
canvas.height = 135;

const LoadImage = async (src) => {
  const image = new Image(canvas.width, canvas.height);
  image.referrerPolicy = "no-referrer";
  image.src = src;
  const result = await new Promise((resolve, reject) => {
    image.addEventListener("load", () => {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpg"));
    });
    image.addEventListener("error", () =>
      reject(new Error(`Failed to load image: ${src}`)),
    );
  });
  return result;
};

export const ExportWord = async (comments, config, need) => {
  let total = 0;
  let sections = comments.map(async (v) => {
    let children = config.map(async (key) => {
      let child = new TextRun({
        text: v[key],
        size: 24,
        italics: false,
        bold: key === Mapping[3].value,
      });
      if (key === Mapping[4].value) {
        child = new ExternalHyperlink({ children: [child], link: v[key] });
      } else if (key === Mapping[2].value && v[key]) {
        child = new ImageRun({
          data: await LoadImage(v[key]),
          transformation: { width: canvas.width, height: canvas.height },
        });
      } else if (key === Mapping[1].value) {
        const text = v[key].replace(
          /<img width="20" height="20" src="[^"]*" alt="([^"]*)" loading="lazy" \/>/gi,
          "$1",
        );
        child = new TextRun({ text, size: 24, italics: false });
      }
      const mapping = findMapping(key);
      return new Paragraph({
        children: [
          new TextRun({
            text: `【${mapping ? mapping.text : key}】`,
            bold: true,
            size: 24,
          }),
          child,
        ],
        heading: key === Mapping[3].value ? HeadingLevel.HEADING_3 : undefined,
      });
    });
    children = await Promise.all(children);
    children.push(new Paragraph("\n"));
    total += v.duration || 0;
    return {
      properties: { type: SectionType.CONTINUOUS },
      children,
    };
  });
  sections = await Promise.all(sections);
  if (need) {
    const p = new Paragraph({
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
    });
    sections.unshift({ children: [p, new Paragraph("\n")] });
  }
  const buffer = await Packer.toBuffer(
    new Document({ title: "动画鉴赏", sections }),
  );
  return buffer;
};

export const ExportExcel = async (comments, config, need) => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("动画鉴赏");

  const avatarCol = config.indexOf("avatar");
  const bvidCol = config.indexOf("bvid");

  const ColumnWidths = {
    uname: 14,
    message: 36,
    avatar: 34,
    title: 30,
    bvid: 40,
    duration_desc: 12,
  };
  worksheet.columns = config.map((key) => ({
    header: findMapping(key)?.text || key,
    width: ColumnWidths[key] || 16,
  }));
  worksheet.getRow(1).font = { bold: true };

  let total = 0;

  for (const comment of comments) {
    const rowData = config.map((key) => {
      if (key === "avatar" || key === "bvid") return "";
      if (key === "message") {
        return (comment[key] || "").replace(
          /<img width="20" height="20" src="[^"]*" alt="([^"]*)" loading="lazy" \/>/gi,
          "$1",
        );
      }
      return comment[key] || "";
    });
    const row = worksheet.addRow(rowData);

    if (avatarCol >= 0 && comment.avatar) {
      const dataUrl = await LoadImage(comment.avatar);
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const imageId = workbook.addImage({
        base64: base64Data,
        extension: "jpeg",
      });
      worksheet.addImage(imageId, {
        tl: { col: avatarCol, row: row.number - 1 },
        ext: { width: canvas.width, height: canvas.height },
      });
      row.height = canvas.height * 0.75;
    }

    if (bvidCol >= 0 && comment.bvid) {
      const cell = row.getCell(bvidCol + 1);
      cell.value = { text: comment.bvid, hyperlink: comment.bvid };
      cell.font = { color: { argb: "FF0000FF" }, underline: true };
    }

    total += comment.duration || 0;
  }

  if (need) {
    const durationCol = config.indexOf("duration_desc");
    const rowData = new Array(config.length).fill("");
    rowData[durationCol >= 0 ? durationCol : config.length - 1] =
      `总时长: ${FormatDuration(total, true)}`;
    const totalRow = worksheet.addRow(rowData);
    totalRow.font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const AssHeader = `[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1
Style: Default - Translate,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

export const LineStart = Object.freeze({
  start: "00:00:00.000",
  end: "00:00:00.000",
  lyric: "",
  tlyric: "",
  id: "00:00:00.000",
});

export const ReadLyric = (file) => {
  const LineRegex =
    /Dialogue: \d+,(\d{1}:\d{2}:\d{2}.\d{2}),(\d{1}:\d{2}:\d{2}.\d{2}),(.*),.*,\d+,\d+,\d+,.*,(.*)/g;
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
    if (tlyric) {
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
    id: id || MD5(`${name}.${singer}.${Date.now()}`),
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
    music.tlyric,
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
    },
  );
  const Replace = (s, start, end, m) => {
    m = m.replace(
      /\(\d+,(\d+),\d+\)(.)/g,
      (string, k, v) => `{\\k${+k / 10}}${v}`,
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

export const Base64 = /^data:image\/(png|gif|jpeg);base64,/;

export const DomToImage = async (Dom) =>
  (await HtmlToCanvas(Dom)).toDataURL().replace(Base64, "");

export const ExportCandy = async (file, Dom) => {
  const result = [];
  const chinese = document.querySelector("#dom-to-image-cn .card-text");
  const japanese = document.querySelector("#dom-to-image-jp .card-text");
  const workbook = new Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];

  const rows = [];
  worksheet.eachRow((row) => {
    rows.push({
      cn: row.getCell(1).text,
      jp: row.getCell(2).text,
    });
  });

  for (const { cn, jp } of rows) {
    chinese.innerText = cn;
    japanese.innerText = jp;
    result.push(await DomToImage(Dom));
  }
  chinese.innerText = "";
  japanese.innerText = "";

  return result;
};

export const ReadLogo = (file) => {
  const reader = new FileReader();
  const promise = new Promise((resolve) => {
    reader.addEventListener("load", async ({ target }) =>
      resolve(target.result),
    );
  });
  reader.readAsDataURL(file);
  return promise;
};
