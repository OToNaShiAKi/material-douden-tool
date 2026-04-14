<template>
  <v-container class="lyric-control">
    <v-text-field
      prepend-icon="mdi-microsoft-dynamics-365"
      append-icon="mdi-magnify"
      class="fix-input"
      hint="登录同传软件后，复制动态链接中的数字id输入；多动态时以空格分隔"
      label="动态ID"
      v-model.trim="keyword"
      solo
      dense
      @keypress.enter="Search"
      @click:append="Search"
    />
    <v-data-table
      no-data-text=""
      :items-per-page="15"
      :headers="headers"
      :items="comments"
      :page.sync="page"
      hide-default-footer
      :loading="loading"
    >
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon small @click="Remove" :data-key="item.id">mdi-delete</v-icon>
      </template>
      <template v-slot:[`item.avatar`]="{ value }">
        <v-img class="rounded" :src="value" width="52px" height="32px" />
      </template>
      <template v-slot:[`item.bvid`]="{ value }">
        <a :href="value" @click.prevent="Open">{{ value }}</a>
      </template>
      <template v-slot:[`item.message`]="{ value }">
        <p class="ma-0 d-flex align-center" v-html="value" />
      </template>
      <template v-slot:footer="{ props: { pagination } }">
        <v-pagination
          circle
          class="my-3"
          v-model="page"
          :length="pagination.pageCount"
        />
      </template>
    </v-data-table>
    <section class="d-flex align-center flex-wrap">
      <v-checkbox
        v-for="v of headers.slice(0, 6)"
        :key="v.value"
        hide-details
        dense
        multiple
        class="mr-3"
        :label="v.text"
        v-model="config"
        :value="v.value"
      />
      <v-checkbox hide-details dense label="总时长" v-model="total" />
    </section>
    <v-btn-toggle class="my-3" dense rounded>
      <v-btn
        icon
        :loading="wordExporting"
        :disabled="!comments.length"
        @click="Word"
      >
        <v-icon>mdi-microsoft-word</v-icon>
      </v-btn>
      <v-btn
        icon
        :loading="excelExporting"
        :disabled="!comments.length"
        @click="Excel"
      >
        <v-icon>mdi-microsoft-excel</v-icon>
      </v-btn>
    </v-btn-toggle>
    <p class="caption px-3 mb-0">导出评论同时会导出无视频链接的纯文字评论</p>
  </v-container>
</template>

<script>
import { ipcRenderer, shell } from "electron";
import { ExportWord, ExportExcel, Mapping } from "../../../util/ExportFile";

const FilteredComments = (comments, config) => {
  if (config.includes(Mapping[1].value)) return comments;
  return comments.filter((item) => item.bvid);
};

export default {
  name: "Anime",
  data: () => ({
    keyword: "",
    wordExporting: false,
    excelExporting: false,
    headers: Mapping,
    comments: [],
    loading: false,
    page: 1,
    config: ["avatar", "bvid", "title", "duration_desc", "uname"],
    total: false,
  }),
  methods: {
    async Search() {
      this.loading = true;
      const ids = this.keyword.split(" ");
      this.comments = await ipcRenderer.invoke("GetDynamic", ids);
      this.loading = false;
    },
    Remove({ target: { dataset } }) {
      const { key } = dataset;
      this.comments = this.comments.filter((item) => item.id !== key);
    },
    Open({ target }) {
      const href = target.href;
      shell.openExternal(href);
    },

    async Word() {
      this.wordExporting = true;
      const buffer = await ExportWord(
        FilteredComments(this.comments, this.config),
        this.config,
        this.total,
      );
      ipcRenderer.send("SaveFiles", buffer, `${Date.now()}.docx`);
      this.wordExporting = false;
    },
    async Excel() {
      this.excelExporting = true;
      const buffer = await ExportExcel(
        FilteredComments(this.comments, this.config),
        this.config,
        this.total,
      );
      ipcRenderer.send("SaveFiles", buffer, `${Date.now()}.xlsx`);
      this.excelExporting = false;
    },
  },
};
</script>
