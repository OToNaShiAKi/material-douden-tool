<template>
  <section>
    <Pack>快捷用语</Pack>
    <DataTable :headers="headers" :items="shortcuts">
      <template v-slot="{ item }">
        <v-icon small @click="Remove" :data-key="item.key">mdi-delete</v-icon>
      </template>
    </DataTable>
    <section class="fix-input d-flex align-center">
      <v-text-field v-model.trim="phrase" solo class="mr-3" dense hide-details>
        <template v-slot:prepend-inner>
          <v-select v-model="key" :items="cuts" dense solo hide-details />
        </template>
      </v-text-field>
      <v-btn small :disabled="!phrase" icon color="primary" @click="Add">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </section>
    <p class="caption mb-0 mt-3">替换符：</p>
    <ul class="caption">
      <li>{c}部分会被同传输入框中语句替换</li>
      <li>{v}部分会被剪切板中复制语句替换</li>
      <li>{s}部分会被当前同传歌曲歌名代替 eg: 谢谢 刚才唱了{s}</li>
      <li>{a}部分会被当前同传歌曲歌手代替 eg: 谢谢 刚才唱了{a}的{s}</li>
      <li>{l}部分会被当前同传歌曲轮播到的歌词代替</li>
    </ul>
  </section>
</template>

<script>
import DataTable from "@/components/DataTable.vue";
import { mapMutations } from "vuex";
import Pack from "../../../components/Pack.vue";

export default {
  components: { Pack, DataTable },
  name: "Shortcut",
  computed: {
    shortcuts: ({ $store: { state } }) => {
      const result = [];
      for (let key in state.shortcuts)
        result.push({ key, phrase: state.shortcuts[key] });
      return result.sort((a, b) => (a.key >= b.key ? -1 : 1));
    },
  },
  data: () => ({
    cuts: [
      "Alt+1",
      "Alt+2",
      "Alt+3",
      "Alt+4",
      "Alt+5",
      "Alt+6",
      "Alt+7",
      "Alt+8",
      "Alt+9",
      "Alt+0",
      "Ctrl+1",
      "Ctrl+2",
      "Ctrl+3",
      "Ctrl+4",
      "Ctrl+5",
      "Ctrl+6",
      "Ctrl+7",
      "Ctrl+8",
      "Ctrl+9",
      "Ctrl+0",
    ],
    headers: [
      { text: "快捷键", value: "key" },
      { text: "快捷用语", value: "phrase" },
      { text: "操作", value: "actions", sortable: false },
    ],
    key: "Alt+1",
    phrase: "",
  }),
  methods: {
    ...mapMutations(["ChangeShortcuts"]),
    Add() {
      this.ChangeShortcuts({ key: this.key, value: this.phrase });
      this.key = "Alt+1";
      this.phrase = "";
    },
    Remove({ target: { dataset } }) {
      const { key } = dataset;
      this.ChangeShortcuts({ key, value: "" });
    },
  },
};
</script>