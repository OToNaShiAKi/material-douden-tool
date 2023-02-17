<template>
  <v-subheader class="justify-space-between mt-3">
    <span><slot /></span>
    <v-btn icon @click="Pack">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </v-subheader>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "Pack",
  methods: {
    Pack() {
      this.$router.replace("/");
      ipcRenderer.send("WindowSize", 168);
    },
  },
};
</script>
