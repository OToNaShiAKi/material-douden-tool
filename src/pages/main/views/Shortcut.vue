<template>
  <section>
    <Pack>快捷用语</Pack>
    <v-data-table :items-per-page="5" :items="shortcuts" :headers="headers">
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="remove" :data-key="item.key">mdi-delete</v-icon>
      </template>
    </v-data-table>
    <section class="d-flex">
      <v-select
        v-model="key"
        label="快捷键"
        :items="cuts"
        class="select-width mr-3"
      />
      <v-text-field
        v-model.trim="phrase"
        @keyup.enter="add"
        label="快捷用语"
        append-icon="mdi-arrow-left-bottom"
        hint="可配置常用问候语等，按下快捷键即可立即发送"
        @click:append="add"
        :error-messages="message"
      />
    </section>
    <p class="caption mb-0">替换符：</p>
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
import { mapMutations } from "vuex";
import Pack from "../../../components/Pack.vue";

export default {
  components: { Pack },
  name: "Shortcut",
  computed: {
    shortcuts() {
      const cuts = this.$store.state.shortcuts;
      const result = [];
      for (let key in cuts) result.push({ key, phrase: cuts[key] });
      return result;
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
    key: "",
    phrase: "",
    message: "",
  }),
  methods: {
    ...mapMutations(["ChangeShortcuts"]),
    add() {
      if (this.key.length <= 0 || this.phrase.length <= 0) {
        this.message = "快捷键或短语不可为空";
        return;
      }
      this.ChangeShortcuts({ key: this.key, value: this.phrase });
      this.key = "";
      this.phrase = "";
      this.message = "";
    },
    remove({ target: { dataset } }) {
      const { key } = dataset;
      this.ChangeShortcuts({ key, value: "" });
    },
  },
};
</script>
