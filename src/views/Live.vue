<template>
  <section>
    <section class="d-flex">
      <v-switch inset class="mr-3" label="自动分词" v-model="cut" />
      <v-select :items="rooms" chips multiple v-model="show" />
    </section>
    <v-virtual-scroll
      v-for="v of show"
      :key="v"
      item-height="24"
      height="240"
      :items="comments[22195814]"
    >
      <template v-slot="{ item }">
        <div>
          <span>{{ item.nickname }}：</span>
          <span>{{ item.info }}</span>
          <v-chip x-small v-for="(w, i) of item.word" :key="i">{{ w }}</v-chip>
        </div>
      </template>
    </v-virtual-scroll>
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import { GetWebSocket } from "../plugins/axios";
import { mapState } from "vuex";
import Socket from "../plugins/socket";

export default {
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
    show: [...state.select],
    cut: true,
  }),
  methods: {},
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
            22195814,
            item.token
          );
          this.sockets[22195814] = socket;
          comments[22195814] = socket.comments;
        }
        this.comments = comments;
      },
      immediate: true,
    },
  },
};
</script>
