<template>
  <v-container class="lyric-control">
    <v-text-field
      append-icon="mdi-magnify"
      class="fix-input"
      hint="多动态时以空格分隔，自动过滤非推荐视频评论"
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
      <v-checkbox
        hide-details
        dense
        label="总时长"
        v-model="total"
      />
    </section>
    <v-btn-toggle class="my-3" dense rounded>
      <v-btn icon :loading="exporting" @click="Word">
        <v-icon>mdi-microsoft-word</v-icon>
      </v-btn>
      <v-btn icon @click="Excel">
        <v-icon>mdi-microsoft-excel</v-icon>
      </v-btn>
    </v-btn-toggle>
    <p class="caption px-3 mb-0">
      仅Word格式支持导出封面图片，同时耗时会比较长。
    </p>
  </v-container>
</template>

<script>
import { ipcRenderer, shell } from "electron";
import { ExportWord, ExportExcel, WriteExcel } from "../../../util/ExportFile";

export default {
  name: "Anime",
  data: () => ({
    keyword: "",
    exporting: false,
    headers: [
      { text: "封面", value: "avatar", sortable: false },
      { text: "标题", value: "title" },
      { text: "链接", value: "bvid", sortable: false },
      { text: "时长", value: "duration_desc" },
      { text: "推荐人", value: "uname" },
      { text: "发布点", value: "time_desc" },
      { text: "操作", value: "actions", sortable: false },
    ],
    comments: [],
    loading: false,
    page: 1,
    config: ["title", "bvid", "duration_desc"],
    total: true,
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
      this.exporting = true;
      const buffer = await ExportWord(this.comments, this.config, this.total);
      ipcRenderer.send("SaveFiles", buffer, `${Date.now()}.docx`);
      this.exporting = false;
    },
    Excel() {
      const result = ExportExcel(this.comments, this.config, this.total);
      WriteExcel(result.body, result.header, Date.now(), "动画鉴赏", {
        cols: result.cols,
      });
    },
  },
};
</script>
