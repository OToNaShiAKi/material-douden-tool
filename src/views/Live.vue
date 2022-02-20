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
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const first = item.host_list.pop();
      this.socket[item.roomid] = new Socket(
        first.host,
        first.wss_port,
        item.roomid,
        item.token
      );
    }
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  computed: {
    ...mapState(["select"]),
  },
  data: () => ({
    socket: {},
    timer: null,
  }),
};
</script>
