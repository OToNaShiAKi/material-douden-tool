<template>
  <section>
    <Pack>设置Cookie</Pack>
    <v-textarea
      v-model="cookie"
      label="Bilibili Cookie"
      auto-grow
      autofocus
      outlined
      clearable
      class="rounded-tl-xl rounded-br-xl"
      @input="setcookie"
    />
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import Pack from "../components/Pack.vue";
import { ChangeCookie } from "../plugins/axios";

export default {
  name: "Cookie",
  components: { Pack },
  data: () => ({ cookie: "" }),
  methods: {
    setcookie(input) {
      if (input) {
        const bili_jct = input.match(/bili_jct=([^;]+);/);
        if (bili_jct) {
          ipcRenderer.send(ChangeCookie, input, bili_jct[1]);
        }
        localStorage.setItem("cookie", input);
      }
    },
  },
};
</script>
