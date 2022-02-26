<template>
  <section>
    <Pack>配置项</Pack>
    <v-data-table hide-default-header :items="fixes" :headers="headers" />
    <section class="d-flex align-center">
      <v-text-field class="mr-3" v-model="prefix" label="前缀" />
      <v-text-field class="mr-3" v-model="suffix" label="后缀" />
      <v-select class="mr-3" :items="scopes" v-model="scope" label="作用域" />
      <v-btn
        :disabled="!(prefix && suffix && scope)"
        outlined
        small
        color="primary"
        @click="add"
      >
        添加
      </v-btn>
    </section>
  </section>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Pack from "../components/Pack.vue";
import { ChangeFixes } from "../store/mutations";

export default {
  name: "Setting",
  components: { Pack },
  data: () => ({
    prefix: "",
    suffix: "",
    scope: "全部",
    scopes: ["同传", "歌曲", "全部"],
    headers: [
      { text: "前缀", value: "prefix" },
      { text: "后缀", value: "suffix" },
      { text: "作用域", value: "scope" },
    ],
  }),
  computed: { ...mapState(["fixes"]) },
  methods: {
    ...mapMutations([ChangeFixes.name]),
    add() {
      this.fixes.push({
        prefix: this.prefix,
        suffix: this.suffix,
        text: this.prefix + " " + this.suffix,
        scope: this.scope,
      });
      this.ChangeFixes(this.fixes);
      this.prefix = "";
      this.suffix = "";
      this.scope = "全部";
    },
    remove(index) {
      this.fixes.splice(index, 1);
      this.ChangeFixes(this.fixes);
    },
  },
};
</script>
