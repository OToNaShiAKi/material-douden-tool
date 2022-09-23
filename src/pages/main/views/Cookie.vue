<template>
  <section class="relative">
    <Pack>登录Bilibili</Pack>
    <v-img
      @click="login"
      :src="code"
      eager
      class="mx-auto"
      style="cursor: pointer"
      width="240"
      height="240"
    >
      <template>
        <section
          v-if="!code"
          class="fill-height caption primary--text d-flex flex-column align-center justify-center"
        >
          <v-icon color="primary" large>mdi-refresh</v-icon>
          <span>二维码已失效</span>
          <span>点击重新获取</span>
          <span>Cookie存在即登陆成功</span>
        </section>
      </template>
    </v-img>
    <p class="caption text-center">使用Bilibili扫码即可</p>
    <v-textarea
      v-model="cookie"
      label="Bilibili Cookie"
      auto-grow
      outlined
      :spellcheck="false"
      clearable
      class="rounded-tl-xl rounded-br-xl mt-3"
      @input="ChangeCookie"
    />
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapMutations } from "vuex";
import Pack from "../../../components/Pack.vue";
import QRCode from "qrcode";

export default {
  name: "Cookie",
  components: { Pack },
  created() {
    this.cookie || this.login();
    ipcRenderer.on("Login", (event, result) => {
      if (result.status) {
        this.code = "";
        this.cookie = result.query;
        this.ChangeCookie(this.cookie);
        this.Notify("登陆成功");
      } else if (result.data === -2) this.code = "";
    });
  },
  data: ({ $store: { state } }) => ({
    cookie: state.cookie,
    code: "",
  }),
  methods: {
    ...mapMutations(["ChangeCookie", "Notify"]),
    async login() {
      if (!this.code) {
        const url = await ipcRenderer.invoke("BilibiliLogin");
        this.code = await QRCode.toDataURL(url);
      }
    },
  },
};
</script>
