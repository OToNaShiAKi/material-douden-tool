<template>
  <section>
    <Pack>登录</Pack>
    <v-tabs v-model="tab" centered>
      <v-tab href="#Bilibili">Bilibili</v-tab>
      <v-tab href="#QQMusic">QQMusic</v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab" class="fix-input">
      <v-tab-item value="Bilibili" transition="fade-transition">
        <v-hover v-slot="{ hover }">
          <v-img height="210" :src="code">
            <template>
              <v-img contain width="240" :src="hint" v-if="hover && code" />
              <section
                v-else-if="!code"
                class="fill-height caption d-flex flex-column align-center justify-center"
              >
                <v-icon color="primary" large>mdi-refresh</v-icon>
                <span>二维码已失效</span>
                <span>点击重新获取</span>
                <span>Cookie存在即登陆成功</span>
              </section>
            </template>
          </v-img>
        </v-hover>
        <v-textarea
          v-model="cookie"
          label="Bilibili Cookie"
          auto-grow
          hide-details
          solo
          :spellcheck="false"
          clearable
          @input="ChangeCookie"
        />
      </v-tab-item>
      <v-tab-item value="QQMusic" transition="fade-transition"> </v-tab-item>
    </v-tabs-items>
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
  data: ({ $store: { state } }) => ({
    cookie: state.cookie,
    code: "",
    tab: "Bilibili",
    hint: "https://s1.hdslb.com/bfs/seed/jinkela/short/mini-login-v2/img/qr-tips.74063ae1.png",
  }),
  created() {
    !this.cookie && this.Login();
    ipcRenderer.on("Login", (event, result) => {
      if (result.status) {
        this.code = "";
        this.cookie = result.query;
        this.ChangeCookie(this.cookie);
        this.Notify("登陆成功");
      } else if (result.data === -2) {
        this.code = "";
      }
    });
  },
  methods: {
    ...mapMutations(["ChangeCookie", "Notify"]),
    async Login() {
      if (!this.code) {
        const url = await ipcRenderer.invoke("BilibiliLogin");
        this.code = await QRCode.toDataURL(url);
      }
    },
  },
};
</script>
