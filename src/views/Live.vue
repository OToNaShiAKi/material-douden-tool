<template>
  <section></section>
</template>

<script>
import { ipcRenderer } from "electron";
import { GetWebSocket } from "../plugins/axios";
import { mapState } from "vuex";
// import Socket from "../plugins/socket";

export default {
  name: "Live",
  async created() {
    const result = await ipcRenderer.invoke(GetWebSocket.name, this.select);
    console.log(...result);
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
