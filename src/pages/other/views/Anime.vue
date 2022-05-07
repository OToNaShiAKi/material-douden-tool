<template>
  <v-container>
    <v-text-field
      v-model.trim="keyword"
      prepend-inner-icon="mdi-magnify"
      append-icon="mdi-arrow-left-bottom"
      @keypress.enter="search"
      @click:append="search"
      label="动态ID"
      hint="多动态时以顿号（、）分隔，自动过滤非推荐视频评论"
    />
    <v-data-table
      :loading="loading"
      :items-per-page="15"
      :headers="headers"
      :items="comments"
    >
      <template v-slot:item.actions="{ index }">
        <v-icon small @click="remove" :data-key="index">mdi-delete</v-icon>
      </template>
      <template v-slot:item.bvid="{ value }">
        <a :href="value" @click.prevent="open">{{ value }}</a>
      </template>
    </v-data-table>
    <section class="d-flex align-center flex-wrap">
      <v-checkbox class="mr-6" label="标题" v-model="config" value="title" />
      <v-checkbox class="mr-6" label="链接" v-model="config" value="bvid" />
      <v-checkbox
        class="mr-6"
        label="时长"
        v-model="config"
        value="duration_desc"
      />
      <v-checkbox class="mr-6" label="推荐" v-model="config" value="uname" />
      <v-checkbox
        class="mr-6"
        label="发布"
        v-model="config"
        value="time_desc"
      />
      <v-checkbox class="mr-6" label="总时长" v-model="total" value="total" />
    </section>
    <section>
      <v-btn outlined small class="mr-3" color="primary" @click="excel">
        导出Excel
      </v-btn>
      <v-btn outlined small color="primary" @click="word"> 导出Word </v-btn>
    </section>
    <p class="caption mt-3">
      例： https://t.bilibili.com/631554183365918759
      中649229816518672409为动态id部分
    </p>
  </v-container>
</template>

<script>
import { ipcRenderer, shell } from "electron";
import { ExportExcel, FormatDuration } from "../../../plugins/utils";
import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
} from "docx";

const Mapping = Object.freeze({
  title: "标题",
  bvid: "链接",
  duration_desc: "时长",
  time_desc: "发布",
  uname: "推荐",
});

export default {
  name: "Anime",
  data: () => ({
    keyword: "",
    loading: false,
    headers: [
      { text: "标题", value: "title" },
      { text: "链接", value: "bvid" },
      { text: "时长", value: "duration_desc" },
      { text: "发布", value: "time_desc" },
      { text: "操作", value: "actions", sortable: false },
    ],
    comments: [],
    config: ["title", "bvid", "duration_desc"],
    total: true,
  }),
  methods: {
    async search() {
      this.loading = true;
      const ids = this.keyword.split("、");
      this.comments = await ipcRenderer.invoke("GetDynamic", ids);
      this.loading = false;
    },
    remove({ target: { dataset } }) {
      const { key } = dataset;
      this.comments.splice(key, 1);
    },
    excel() {
      let total = 0;
      const header = this.config.map((v) => Mapping[v]);
      const cols = this.config.map(() => ({ wch: 0 }));
      const body = this.comments.map((v) => {
        const row = {};
        for (let i = 0; i < this.config.length; i++) {
          const key = this.config[i];
          row[Mapping[key]] = v[key];
          const width = /[\u4e00-\u9fa5]/.test(row[Mapping[key]])
            ? row[Mapping[key]].length * 2
            : row[Mapping[key]].length + 10;
          cols[i].wch = cols[i].wch > width ? cols[i].wch : width;
        }
        total += v.duration || 0;
        return row;
      });
      if (this.total) body.push({ 时长: FormatDuration(total, true) });
      ExportExcel(body, header, Date.now(), "动画鉴赏", { cols });
    },
    async word() {
      let total = 0;
      const sections = this.comments.map((v) => {
        const children = this.config.map((key) => {
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
      if (this.total)
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
      const doc = new Document({ title: "动画鉴赏", sections });
      const buffer = await Packer.toBuffer(doc);
      ipcRenderer.send("SaveFiles", buffer, `${Date.now()}.docx`);
    },
    open({ target }) {
      const href = target.href;
      shell.openExternal(href);
    },
  },
};
</script>
