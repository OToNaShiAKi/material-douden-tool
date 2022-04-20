<template>
  <section>
    <Pack>标识符</Pack>
    <v-data-table :items="fixes" :headers="headers">
      <template v-slot:item.actions="{ index }">
        <v-icon small @click="remove" :data-key="index"> mdi-delete </v-icon>
      </template>
    </v-data-table>
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
import Pack from "../../../components/Pack.vue";

export default {
  name: "Bracket",
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
      { text: "操作", value: "actions", sortable: false },
    ],
  }),
  computed: { ...mapState(["fixes"]) },
  methods: {
    ...mapMutations(["ChangeFixes"]),
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
    remove({ target: { dataset } }) {
      const { key } = dataset;
      this.fixes.splice(key, 1);
      this.ChangeFixes(this.fixes);
    },
  },
};
</script>
