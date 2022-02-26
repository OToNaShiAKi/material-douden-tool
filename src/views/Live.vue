<template>
  <section></section>
</template>

<script>
import { ipcRenderer } from "electron";
import { GetWebSocket } from "../plugins/axios";
import { mapState } from "vuex";
import Socket from "../plugins/socket";

export default {
  name: "Live",
  async created() {
    const result = await ipcRenderer.invoke(GetWebSocket.name, this.select);
    for (const item of result) {
      const first = item.host_list.pop();
      this.socket[item.roomid] = new Socket(
        first.host,
        first.wss_port,
        24308519,
        item.token
      );
    }
  },
  computed: { ...mapState(["select"]) },
  data: () => ({ sockets: {} }),
  watch: {
    select(next) {
      const socket = [...next];
      for (const key in this.sockets) {
        const index = socket.indexOf(key);
        if (index) {
          this.sockets[key].socket.close();
          delete this.sockets[key];
          socket.splice(1);
        }
      }
    },
  },
};
</script>
