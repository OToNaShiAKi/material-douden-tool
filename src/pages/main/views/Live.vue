<template>
  <section>
    <Pack>弹幕捕获</Pack>
    <section class="d-flex">
      <v-switch inset class="mr-3 ml-1" label="翻译" v-model="translate" />
      <v-select
        hint="用户名称、弹幕、翻译均可点击复制；详细设置在设置页面"
        :items="rooms"
        v-model="show"
      />
    </section>
    <section id="danmu" ref="danmu" @click="copy">
      <div
        v-for="(v, k) of comments[show]"
        :key="k"
        class="caption d-flex align-baseline"
      >
        <v-chip
          v-if="sockets[show] && sockets[show].admin && v.uid !== uid"
          x-small
          outlined
          :data-uid="v.uid"
          :data-nickname="v.nickname"
        >
          禁言
        </v-chip>
        <span class="ml-2">{{ v.nickname }}</span>
        ：
        <span :class="v.class" :style="v.style">{{ v.info }}</span>
        <span v-show="translate && v.text">（{{ v.text }}）</span>
      </div>
    </section>
    <p class="caption ma-1">
      可在<v-icon small>mdi-seed</v-icon>页面中进行直播追帧
    </p>
  </section>
</template>

<script>
import { clipboard, ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
import Pack from "../../../components/Pack.vue";
import Socket from "../../../plugins/socket";

export default {
  components: { Pack },
  name: "Live",
  computed: {
    ...mapState(["select"]),
    rooms() {
      return this.$store.state.rooms.filter(({ value }) =>
        this.select.includes(value)
      );
    },
  },
  data: ({ $store: { state } }) => ({
    sockets: {},
    comments: {},
    show: state.select[0],
    translate: true,
    uid: "",
  }),
  created() {
    Socket.plugin = this;
    const uid = this.$store.state.cookie.match(/DedeUserID=([^;]+);/);
    this.uid = uid[1];
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
        innerText = innerText.replace(/（|）/g, "");
        clipboard.writeText(innerText);
        this.Notify("已复制：" + innerText);
      }
    },
  },
  watch: {
    select: {
      async handler(next) {
        const sockets = [...next];
        const comments = { ...this.comments };
        for (const key in this.sockets) {
          const index = sockets.indexOf(key);
          if (index < 0) {
            this.sockets[key].socket.close();
            delete this.sockets[key];
            delete comments[key];
          } else sockets.splice(index, 1);
        }
        const result = await ipcRenderer.invoke("GetWebSocket", sockets);
        for (const item of result) {
          const socket = new Socket(item);
          this.sockets[item.roomid] = socket;
          comments[item.roomid] = item.comments;
        }
        this.comments = comments;
      },
      immediate: true,
    },
  },
};
</script>
