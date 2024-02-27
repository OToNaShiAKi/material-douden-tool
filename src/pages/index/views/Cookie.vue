<template>
  <section>
    <Pack>登录</Pack>
    <HonourAvatar class="mx-auto d-block" v-if="cookie" :size="150" />
    <v-img
      class="mx-auto qrcode"
      content-class="d-flex justify-center align-center"
      height="150"
      width="150"
      contain
      v-else
      :src="code"
    >
      <section
        v-if="!code"
        class="fill-height caption d-flex flex-column align-center justify-center"
      >
        <v-btn @click="Login" class="mb-2" large icon color="primary">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <span>二维码已失效</span>
        <span>点击刷新</span>
      </section>
    </v-img>
    <v-textarea
      v-model="cookie"
      label="Bilibili Cookie"
      auto-grow
      class="mt-6 fix-input"
      hide-details
      solo
      :spellcheck="false"
      clearable
      @input="ChangeCookie"
    />
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapMutations } from "vuex";
import Pack from "../../../components/Pack.vue";
import QRCode from "qrcode";
import HonourAvatar from "../../../components/HonourAvatar.vue";

export default {
  name: "Cookie",
  components: { Pack, HonourAvatar },
  data: ({ $store: { state } }) => ({ cookie: state.cookie, code: "" }),
  created() {
    !this.cookie && this.Login();
    ipcRenderer.on("Login", (event, result) => {
      if (result.status) {
        this.code = "";
        this.cookie = result.query;
        this.ChangeCookie(this.cookie);
        this.Notify("登陆成功");
        this.$router.push("/room");
      } else if (result.code === 86038) {
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
