fi
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
      <template v-slot:item.ctime="{ item }">
        {{ item.time_desc }}
      </template>
      <template v-slot:item.duration="{ value }">
        {{ value | Timer }}
      </template>
    </v-data-table>
    <v-btn outlined small color="primary">导出Excel</v-btn>
    <p class="caption">
      例： https://t.bilibili.com/631554183365918759
      中649229816518672409为动态id部分
    </p>
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";
// import { ExportExcel } from "../../../plugins/utils";

export default {
  name: "App",
  data: () => ({
    keyword: "",
    loading: false,
    headers: [
      { text: "标题", value: "title" },
      { text: "链接", value: "bvid" },
      { text: "时长", value: "duration" },
      { text: "时间", value: "ctime" },
      { text: "操作", value: "actions", sortable: false },
    ],
    comments: [],
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
  },
  filters: {
    Timer: (value) => {
      if (!value) return value;
      const m = Math.floor(value / 60);
      const s = value - m * 60;
      return m + ":" + s.toString().padStart(2, "0");
    },
  },
};
</script>
