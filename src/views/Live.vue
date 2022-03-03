<template>
  <section>
    <Pack>弹幕捕获</Pack>
    <section class="d-flex">
      <v-switch inset class="mr-3 ml-" label="展示分词" v-model="cut" />
      <v-select
        hint="用户名称、弹幕、关键词均可点击复制"
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
          v-if="sockets[show].admin"
          x-small
          outlined
          :data-uid="item.uid"
        >
          禁言
        </v-chip>
        <span class="font-weight-medium ml-3">{{ v.nickname }}</span>
        ：
        <section class="d-flex flex-column flex-grow-1">
          <span>{{ v.info }}</span>
          <section v-show="cut" :max="0">
            <v-chip x-small v-for="(w, i) of v.word" :key="i">
              {{ w }}
            </v-chip>
          </section>
        </section>
      </div>
    </section>
  </section>
</template>

<script>
import { clipboard, ipcRenderer } from "electron";
import { GetWebSocket, SilentUser } from "../plugins/axios";
import { mapMutations, mapState } from "vuex";
import Socket from "../plugins/socket";
import { Notify } from "../store/mutations";
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
    cut: false,
  }),
  methods: {
    ...mapMutations([Notify.name]),
    copy({ target }) {
      const { innerText } = target;
      const uid = target.dataset.uid || target.parentElement.dataset.uid;
      if (uid) {
        ipcRenderer.send(SilentUser.name, uid, this.show);
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
        const result = await ipcRenderer.invoke(GetWebSocket.name, sockets);
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
