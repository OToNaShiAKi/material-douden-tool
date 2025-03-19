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
    <v-virtual-scroll
      item-height="20"
      height="360"
      ref="comments"
      :items="comments[show.value]"
      @click="Copy"
    >
      <template v-slot="{ item }">
        <p class="d-flex caption ma-0 text-truncate align-center">
          <v-chip
            label
            x-small
            @click.stop="() => SilentUser(item)"
            v-if="sockets[show.value]?.admin && !item.admin"
          >
            禁言
          </v-chip>
          <span class="ml-2 d-flex align-center" v-html="item.name" />
          <span class="mr-2">:</span>
          <span
            class="d-flex align-center"
            :style="item.style"
            v-html="item.message"
          />
        </p>
      </template>
    </v-virtual-scroll>
    <v-btn class="fix-button" fab x-small right bottom fixed @click="Top">
      <v-icon color="primary">mdi-arrow-up-bold</v-icon>
    </v-btn>
  </section>
</template>

<script>
import Socket from "../../../plugins/socket";
import { CommentLength } from "../../../util/SendComment";
import { clipboard, ipcRenderer } from "electron";
import { mapMutations } from "vuex";
import Pack from "../../../components/Pack.vue";
import GoTo from "vuetify/lib/services/goto";

export default {
  components: { Pack },
  name: "Live",
  data: ({ $store: { state } }) => ({
    comments: {},
    sockets: {},
    show: state.rooms.find(({ value }) => value === state.select[0]) || "",
  }),
  computed: {
    rooms: ({ $store: { state } }) =>
      state.rooms.filter(({ value }) => state.select.includes(value)),
  },
  methods: {
    ...mapMutations(["Notify"]),
    Copy({ target }) {
      let { innerText } = target;
      if (innerText && !/\n/.test(innerText)) {
        innerText = innerText.replace(/\(|\)|:/g, "");
        clipboard.writeText(innerText);
        this.Notify("已复制：" + innerText);
      }
    },
    async SilentUser({ uid, name, message }) {
      const result = await ipcRenderer.invoke(
        "SilentUser",
        uid,
        this.show.value,
        message
      );
      this.Notify(`禁言 ${name} ${result ? "成功" : "失败"}`);
    },
    Top() {
      GoTo(0, {
        container: this.$refs.comments,
        easing: "easeInOutCubic",
      });
    },
  },
  watch: {
    rooms: {
      async handler(next) {
        const sockets = next.map((item) => ({
          roomid: item.value,
          room_name: item.text,
          room_avatar: item.avatar,
        }));
        const comments = { ...this.comments };
        for (const key in this.sockets) {
          const index = sockets.findIndex(({ roomid }) => key == roomid);
          if (index < 0) {
            this.sockets[key].reconnect = false;
            this.sockets[key].socket.close();
            delete this.sockets[key];
            delete comments[key];
          } else {
            sockets.splice(index, 1);
          }
        }
        const result = await ipcRenderer.invoke("GetWebSocket", sockets);
        for (let i = 0; i < result.length; i += 1) {
          const item = result[i];
          CommentLength[item.roomid] = item.length;
          item.name = sockets[i].room_name;
          const socket = this.sockets[item.roomid] ?? new Socket(item);
          this.sockets[item.roomid] = socket;
          comments[item.roomid] = socket.comments;
        }
        this.comments = comments;
        if (!result.find(({ roomid }) => roomid === this.show.value)) {
          this.show = this.rooms[0] || "";
        }
      },
      immediate: true,
    },
  },
};
</script>
