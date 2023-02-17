<template>
  <section>
    <Pack>标识符</Pack>
    <DataTable :headers="headers" :items="fixes">
      <template v-slot="{ item }">
        <v-icon small @click="Remove" :data-key="item.text">
          mdi-delete
        </v-icon>
      </template>
    </DataTable>
    <section class="fix-input d-flex align-center">
      <v-text-field
        hide-details
        solo
        dense
        class="mr-3"
        v-model="prefix"
        label="前缀"
      />
      <v-text-field
        hide-details
        solo
        dense
        class="mr-3"
        v-model="suffix"
        label="后缀"
      />
      <v-select
        hide-details
        solo
        dense
        class="mr-3"
        :items="scopes"
        v-model="scope"
        label="作用域"
      />
      <v-btn small :disabled="!scope" icon color="primary" @click="Add">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </section>
  </section>
</template>

<script>
import DataTable from "../../../components/DataTable.vue";
import Pack from "../../../components/Pack.vue";
import { mapMutations, mapState } from "vuex";

export default {
  name: "Bracket",
  components: { Pack, DataTable },
  data: () => ({
    prefix: "",
    suffix: "",
    scope: "同传",
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
    ...mapMutations(["ChangeConfig"]),
    Add() {
      const text = this.prefix + " " + this.suffix;
      const find = this.fixes.find((item) => item.text === text);
      if (!find) {
        this.fixes.push({
          prefix: this.prefix,
          suffix: this.suffix,
          text,
          scope: this.scope,
        });
      }
      this.ChangeConfig({ key: "fixes", config: this.fixes });
      this.prefix = "";
      this.suffix = "";
      this.scope = "同传";
    },
    Remove({ target: { dataset } }) {
      const fixes = this.fixes.filter((item) => item.text !== dataset.key);
      this.ChangeConfig({ key: "fixes", config: fixes });
    },
  },
};
</script>
