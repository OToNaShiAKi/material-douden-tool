<template>
  <section>
    <div v-for="(v, k) in sockets" :key="k">
      <p class="mb-0">{{ v.roomid }}</p>
      <v-virtual-scroll item-height="24" height="240" :item="v.comments">
        <template v-slot="{ item }">
          <div>
            <span>{{ item.name }}：</span>
            <span>{{ item.info }}</span>
            <v-chip v-for="(v, i) of item.word" :key="i">{{ v }}</v-chip>
          </div>
        </template>
      </v-virtual-scroll>
    </div>
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import { GetWebSocket } from "../plugins/axios";
import { mapState } from "vuex";
import Socket from "../plugins/socket";

export default {
  name: "Live",
  computed: { ...mapState(["select"]) },
  data: () => ({ sockets: {} }),
  watch: {
    select: {
      async handler(next) {
        const sockets = [...next];
        for (const key in this.sockets) {
          const index = sockets.indexOf(key);
          if (index >= 0) {
            this.sockets[key].socket.close();
            delete this.sockets[key];
          } else sockets.splice(index, 1);
        }
        const result = await ipcRenderer.invoke(GetWebSocket.name, sockets);
        for (const item of result) {
          console.log(item);
          const first = item.host_list.pop();
          this.sockets[item.roomid] = new Socket(
            first.host,
            first.wss_port,
            first.roomid,
            item.token
          );
        }
      },
      immediate: true,
    },
  },
};
</script>
