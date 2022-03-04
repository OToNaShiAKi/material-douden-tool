<template>
  <section>
    <Pack>弹幕捕获</Pack>
    <v-select hint="用户名称、弹幕均可点击复制" :items="rooms" v-model="show" />
    <section id="danmu" ref="danmu" @click="copy">
      <div
        v-for="(v, k) of comments[show]"
        :key="k"
        class="caption d-flex align-baseline"
      >
        <v-chip
          v-if="sockets[show].admin"
          x-small
          outlined
          :data-uid="item.uid"
        >
          禁言
        </v-chip>
        <span class="font-weight-medium ml-3">{{ v.nickname }}</span>
        ：
        <span>{{ v.info }}</span>
      </div>
    </section>
  </section>
</template>

<script>
import { clipboard, ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
import Socket from "../plugins/socket";
import Pack from "../components/Pack.vue";

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
  }),
  methods: {
    ...mapMutations(["Notify"]),
    copy({ target }) {
      const { innerText } = target;
      const uid = target.dataset.uid || target.parentElement.dataset.uid;
      if (uid) {
        ipcRenderer.send("SilentUser", uid, this.show);
        this.Notify("已禁言：" + uid);
      } else if (innerText && !/\n/.test(innerText)) {
        clipboard.writeText(innerText);
        this.Notify("已复制：" + innerText);
      }
    },
    receive(roomid, message) {
      this.comments[roomid].push(message);
      if (roomid === +this.show) {
        const target = this.$refs.danmu;
        this.$vuetify.goTo(target.scrollHeight, {
          container: target,
          easing: "easeInOutCubic",
        });
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
          const first = item.host_list.pop();
          const socket = new Socket(
            first.host,
            first.wss_port,
            +item.roomid,
            item.token,
            item.admin,
            this.receive
          );
          this.sockets[item.roomid] = socket;
          comments[item.roomid] = socket.comments;
        }
        this.comments = comments;
      },
      immediate: true,
    },
  },
};
</script>
