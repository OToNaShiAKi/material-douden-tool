<template>
  <section>
    <Pack>登录Bilibili</Pack>
    <v-textarea
      v-model="cookie"
      label="Bilibili Cookie"
      auto-grow
      outlined
      :spellcheck="false"
      clearable
      class="rounded-tl-xl rounded-br-xl"
      @input="ChangeCookie"
    />
  </section>
</template>

<script>
import { mapMutations } from "vuex";
import Pack from "../../../components/Pack.vue";

export default {
  name: "Cookie",
  components: { Pack },
  data: ({ $store: { state } }) => ({ cookie: state.cookie }),
  methods: { ...mapMutations(["ChangeCookie"]) },
};
</script>
