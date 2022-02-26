<template>
  <section>
    <Pack>设置Cookie</Pack>
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
import Pack from "../components/Pack.vue";
import { ChangeCookie } from "../store/mutations";
import { mapMutations } from "vuex";

export default {
  name: "Cookie",
  components: { Pack },
  data: ({ $store: { state } }) => ({ cookie: state.cookie }),
  methods: { ...mapMutations([ChangeCookie.name]) },
};
</script>
