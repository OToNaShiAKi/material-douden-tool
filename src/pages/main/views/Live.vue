<template>
  <section>
    <Pack>弹幕捕获</Pack>
    <section class="d-flex">
      <v-switch inset class="mr-3 ml-1" label="翻译" @change="AutoTranslate" v-model="translate" />
      <v-select
        hint="用户名称、弹幕、翻译均可点击复制；详细设置在设置页面"
        :items="rooms"
        v-model="show"
      />
    </section>
    <v-virtual-scroll
      :items="comments[show]"
      id="danmu"
      ref="danmu"
      class="caption"
      @click="copy"
      item-height="20"
    >
      <template v-slot:default="{ item }">
        <v-chip
          v-if="sockets[show] && sockets[show].admin && item.uid != uid"
          x-small
          outlined
          :data-uid="item.uid"
          :data-nickname="item.nickname"
        >
          禁言
        </v-chip>
        <span class="ml-2">{{ item.nickname }}：</span>
        <span :class="item.class" :style="item.style">{{ item.info }}</span>
        <span v-show="translate && item.text">（{{ item.text }}）</span>
      </template>
    </v-virtual-scroll>
    <p class="caption ma-1">
      可在<v-icon small>mdi-seed</v-icon>页面中进行直播追帧
    </p>
    <v-btn fab outlined x-small right bottom fixed color="primary" @click="top">
      <v-icon>mdi-arrow-up-bold</v-icon>
    </v-btn>
  </section>
</template>

<script>
import { clipboard, ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
import Pack from "../../../components/Pack.vue";
import Socket from "../../../plugins/socket";
import { FormatComment } from "../../../plugins/utils";

export default {
  components: { Pack },
  name: "Live",
  computed: {
    ...mapState(["select"]),
    rooms: ({ $store: { state } }) =>
      state.rooms.filter(({ value }) => state.select.includes(value)),
  },
  data: ({ $store: { state } }) => ({
    sockets: {},
    comments: {},
    show: state.select[0],
    uid: "",
    translate: Socket.AutoTranslate
  }),
  created() {
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
        innerText = innerText.replace(/（|）|：/g, "");
        clipboard.writeText(innerText);
        this.Notify("已复制：" + innerText);
      }
    },
    AutoTranslate(value) {
      Socket.AutoTranslate = value
      localStorage.setItem("AutoTranslate", value)
    },
    top() {
      this.$vuetify.goTo(0, {
        container: this.$refs.danmu,
        easing: "easeInOutCubic",
      });
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
            this.sockets[key].reconnect = false;
            this.sockets[key].socket.close();
            delete this.sockets[key];
            delete comments[key];
          } else sockets.splice(index, 1);
        }
        const result = await ipcRenderer.invoke("GetWebSocket", sockets);
        for (const item of result) {
          FormatComment.CommentLength[item.roomid] = item.length;
          const socket = new Socket(item);
          this.sockets[item.roomid] = socket;
          comments[item.roomid] = item.comments;
        }
        this.comments = comments;
        if (!result.find(({ roomid }) => roomid === this.show))
          this.show = result[0].roomid;
      },
      immediate: true,
    },
  },
};
</script>
