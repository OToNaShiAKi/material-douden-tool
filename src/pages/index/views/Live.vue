<template>
  <section>
    <Pack>弹幕捕获</Pack>
    <v-select
      class="fix-input"
      hint="用户名称、弹幕、翻译均可点击复制"
      :items="rooms"
      v-model="show"
      solo
      dense
      return-object
    >
      <template v-slot:item="{ item, on, attrs }">
        <v-list-item v-on="on" v-bind="attrs">
          <v-list-item-avatar>
            <v-img referrepolicy="no-referrer" :src="item.avatar" />
          </v-list-item-avatar>
          <v-list-item-title>{{ item.text }}</v-list-item-title>
        </v-list-item>
      </template>
      <template v-slot:prepend-inner>
        <v-avatar size="32">
          <v-img :src="show.avatar" />
        </v-avatar>
      </template>
    </v-select>
  </section>
</template>

<script>
// import Socket from "../../../plugins/socket";
import { clipboard, ipcRenderer } from "electron";
import { mapMutations } from "vuex";
import Pack from "../../../components/Pack.vue";

export default {
  components: { Pack },
  name: "Live",
  data: ({ $store: { state } }) => ({
    sockets: {},
    show: state.rooms.find(({ value }) => value === state.select[0]),
  }),
  computed: {
    rooms: ({ $store: { state } }) =>
      state.rooms.filter(({ value }) => state.select.includes(value)),
  },
  methods: {
    ...mapMutations(["Notify"]),
    async Copy({ target }) {
      let { innerText } = target;
      const uid = target.dataset.uid || target.parentElement.dataset.uid;
      const nickname =
        target.dataset.nickname || target.parentElement.dataset.nickname;
      if (uid) {
        const result = await ipcRenderer.invoke("SilentUser", uid, this.show);
        this.Notify(result ? "已禁言：" + nickname : "禁言失败");
      } else if (innerText && !/\n/.test(innerText)) {
        innerText = innerText.replace(/（|）|：/g, "");
        clipboard.writeText(innerText);
        this.Notify("已复制：" + innerText);
      }
    },
  },
};
</script>
