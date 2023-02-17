<template>
  <section>
    <v-select
      hint="用户名称、弹幕、翻译均可点击复制；详细设置在设置页面"
      :items="rooms"
      v-model="show"
    />
  </section>
</template>

<script>
import { clipboard, ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
// import Pack from "../../../components/Pack.vue";

// const sockets = {}

export default {
  name: "Live",
  data: ({ $store: { state } }) => ({
    comments: {},
    show: state.select[0],
  }),
  computed: {
    ...mapState(["select"]),
    rooms: ({ $store: { state } }) =>
      state.rooms.filter(({ value }) => state.select.includes(value)),
  },
  methods: {
    ...mapMutations(["Notify"]),
    async copy({ target }) {
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
